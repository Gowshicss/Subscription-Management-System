import { authService } from '../src/services/auth.service';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';
import { Role } from '@prisma/client';
import { restrictDemo } from '../src/middleware/auth';
import bcrypt from 'bcryptjs';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runDemoLoginTests() {
  console.log('================================================================');
  console.log('🧪 TESTING EVALUATOR DEMO-LOGIN & RESTRICTION SAFEGUARDS');
  console.log('================================================================\n');

  const originalFindUnique = prisma.user.findUnique;
  const originalEnableDemo = config.enableDemoLogin;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Demo Quick-Login Disabled Guard
    // -------------------------------------------------------------------------
    console.log('📦 Test 1: Disabled Demo Login Guard');
    (config as any).enableDemoLogin = false;

    let disabledBlocked = false;
    let disabledCode = '';
    try {
      await authService.demoLogin(Role.ADMIN);
    } catch (err: any) {
      disabledBlocked = true;
      disabledCode = err.code;
    }
    assert(disabledBlocked, 'Rejects demo login when enableDemoLogin is false');
    assert(disabledCode === 'DEMO_DISABLED', 'Returns DEMO_DISABLED error code');

    // Enable demo login for remaining tests
    (config as any).enableDemoLogin = true;

    // -------------------------------------------------------------------------
    // TEST 2: Admin Quick-Login Success
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 2: Admin Quick-Login Flow');
    const mockDemoAdmin = {
      id: 'demo-admin-uuid',
      email: config.demoAccounts.adminEmail,
      firstName: 'Demo',
      lastName: 'Admin',
      role: Role.ADMIN,
      isActive: true,
      customer: null,
    };

    (prisma.user as any).findUnique = async ({ where }: any) => {
      if (where.email === config.demoAccounts.adminEmail) {
        return mockDemoAdmin;
      }
      return null;
    };

    const adminResult = await authService.demoLogin(Role.ADMIN);
    assert(!!adminResult.token, 'Generates valid JWT token for demo admin');
    assert(adminResult.user.role === Role.ADMIN, 'Assigns strictly ADMIN role');
    assert(adminResult.user.isDemo === true, 'Flags user session with isDemo = true');
    assert(adminResult.user.email === config.demoAccounts.adminEmail, 'Authenticates dedicated demo admin account');

    // -------------------------------------------------------------------------
    // TEST 3: Staff Quick-Login Success
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 3: Staff Quick-Login Flow');
    const mockDemoStaff = {
      id: 'demo-staff-uuid',
      email: config.demoAccounts.staffEmail,
      firstName: 'Demo',
      lastName: 'Staff',
      role: Role.STAFF,
      isActive: true,
      customer: null,
    };

    (prisma.user as any).findUnique = async ({ where }: any) => {
      if (where.email === config.demoAccounts.staffEmail) {
        return mockDemoStaff;
      }
      return null;
    };

    const staffResult = await authService.demoLogin(Role.STAFF);
    assert(!!staffResult.token, 'Generates valid JWT token for demo staff');
    assert(staffResult.user.role === Role.STAFF, 'Assigns strictly STAFF role');
    assert(staffResult.user.isDemo === true, 'Flags user session with isDemo = true');

    // -------------------------------------------------------------------------
    // TEST 4: Customer Quick-Login Success & Profile Linkage
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 4: Customer Quick-Login Flow');
    const mockDemoCustomer = {
      id: 'demo-cust-user-uuid',
      email: config.demoAccounts.customerEmail,
      firstName: 'Demo',
      lastName: 'Customer',
      role: Role.CUSTOMER,
      isActive: true,
      customer: {
        id: 'crm-demo-cust-id',
        companyName: 'Acme Corp (Evaluator Demo)',
      },
    };

    (prisma.user as any).findUnique = async ({ where }: any) => {
      if (where.email === config.demoAccounts.customerEmail) {
        return mockDemoCustomer;
      }
      return null;
    };

    const customerResult = await authService.demoLogin(Role.CUSTOMER);
    assert(!!customerResult.token, 'Generates valid JWT token for demo customer');
    assert(customerResult.user.role === Role.CUSTOMER, 'Assigns strictly CUSTOMER role');
    assert(customerResult.user.customerId === 'crm-demo-cust-id', 'Attaches linked Customer Profile ID');
    assert(customerResult.user.companyName === 'Acme Corp (Evaluator Demo)', 'Resolves demo customer company name');

    // -------------------------------------------------------------------------
    // TEST 5: Missing Account Handling
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 5: Unprovisioned Demo Account Handling');
    (prisma.user as any).findUnique = async () => null;

    let missingBlocked = false;
    let missingCode = '';
    try {
      await authService.demoLogin(Role.ADMIN);
    } catch (err: any) {
      missingBlocked = true;
      missingCode = err.code;
    }
    assert(missingBlocked, 'Rejects demo login when account is not provisioned in database');
    assert(missingCode === 'DEMO_ACCOUNT_NOT_FOUND', 'Returns DEMO_ACCOUNT_NOT_FOUND error code');

    // -------------------------------------------------------------------------
    // TEST 6: Role Mismatch Safeguard
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 6: Role Integrity & Anti-Spoofing');
    (prisma.user as any).findUnique = async () => ({
      id: 'mismatch-uuid',
      email: config.demoAccounts.adminEmail,
      role: Role.CUSTOMER, // Mismatched role!
      isActive: true,
    });

    let mismatchBlocked = false;
    let mismatchCode = '';
    try {
      await authService.demoLogin(Role.ADMIN);
    } catch (err: any) {
      mismatchBlocked = true;
      mismatchCode = err.code;
    }
    assert(mismatchBlocked, 'Rejects demo login if database role does not match requested role');
    assert(mismatchCode === 'ROLE_MISMATCH', 'Returns ROLE_MISMATCH error code');

    // -------------------------------------------------------------------------
    // TEST 7: Restrict Destructive Actions for Demo Accounts (restrictDemo Middleware)
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 7: Destructive Actions Guard (restrictDemo Middleware)');
    let blockedStatus = 0;
    let blockedResponse: any = null;

    const mockDemoReq: any = {
      user: {
        id: 'demo-admin-uuid',
        email: config.demoAccounts.adminEmail,
        role: Role.ADMIN,
        isDemo: true, // Demo user
      },
    };

    const mockRes: any = {
      status: (code: number) => {
        blockedStatus = code;
        return {
          json: (data: any) => {
            blockedResponse = data;
          },
        };
      },
    };

    let nextCalled = false;
    restrictDemo(mockDemoReq, mockRes, () => {
      nextCalled = true;
    });

    assert(blockedStatus === 403, 'Returns HTTP 403 for demo user on restricted endpoint');
    assert(blockedResponse?.error?.code === 'DEMO_RESTRICTED', 'Returns DEMO_RESTRICTED error code');
    assert(!nextCalled, 'Prevents execution of underlying controller action');

    // Test that real operational admin is NOT restricted
    const mockRealAdminReq: any = {
      user: {
        id: 'real-admin-uuid',
        email: 'real.admin@brightloop.io',
        role: Role.ADMIN,
        isDemo: false, // Real operational admin
      },
    };

    let realAdminNextCalled = false;
    restrictDemo(mockRealAdminReq, mockRes, () => {
      realAdminNextCalled = true;
    });
    assert(realAdminNextCalled, 'Allows operational non-demo admin to perform all administrative operations');

    console.log('\n================================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

  } finally {
    prisma.user.findUnique = originalFindUnique;
    config.enableDemoLogin = originalEnableDemo;
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runDemoLoginTests().catch((err) => {
  console.error('Fatal error in demo login test:', err);
  process.exit(1);
});

