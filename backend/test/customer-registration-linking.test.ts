import { authService, validatePasswordStrength } from '../src/services/auth.service';
import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';
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

async function runRegistrationLinkingTests() {
  console.log('================================================================');
  console.log('🧪 TESTING CUSTOMER REGISTRATION & CRM-TO-PORTAL LINKING LOGIC');
  console.log('================================================================\n');

  // Preserve original methods
  const originalTransaction = prisma.$transaction;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: New Customer Registration (No Pre-existing User or Customer)
    // -------------------------------------------------------------------------
    console.log('📦 Test 1: Brand New Customer Registration');
    let userCreated: any = null;
    let customerCreated: any = null;
    let customerUpdated: any = null;

    (prisma as any).$transaction = async (callback: any) => {
      const mockTx = {
        user: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            userCreated = { id: 'user-uuid-1', ...data };
            return userCreated;
          },
        },
        customer: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            customerCreated = { id: 'cust-uuid-1', ...data };
            return customerCreated;
          },
          update: async ({ data }: any) => {
            customerUpdated = data;
            return { id: 'cust-uuid-1', ...data };
          },
        },
      };
      return callback(mockTx);
    };

    const res1 = await authService.registerCustomer({
      email: 'new.client@example.com',
      password: 'SecurePassword@2026',
      firstName: 'Jane',
      lastName: 'Doe',
      companyName: 'Acme Systems',
      phone: '+1 555-111-2222',
      billingAddress: '100 Market St',
    });

    assert(userCreated !== null, 'Creates new User record');
    assert(userCreated.role === Role.CUSTOMER, 'Enforces Role.CUSTOMER on User');
    assert(customerCreated !== null, 'Creates new Customer record');
    assert(customerCreated.userId === 'user-uuid-1', 'Links new Customer record to created User ID');
    assert(customerUpdated === null, 'Does NOT call update on customer table for new client');
    assert(!!res1.token, 'Generates and returns JWT token');
    assert(res1.user.customerId === 'cust-uuid-1', 'Returns correct customerId in user response');

    // -------------------------------------------------------------------------
    // TEST 2: Existing Unlinked CRM Customer Registration (userId = null)
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 2: Existing Unlinked CRM Customer Registration (CRM-to-Portal Linking)');
    userCreated = null;
    customerCreated = null;
    customerUpdated = null;

    const existingCrmCustomer = {
      id: 'crm-cust-99',
      userId: null,
      companyName: 'Pre-existing Global Logistics Ltd',
      contactName: 'Staff Entered Contact',
      email: 'preexisting.crm@example.com',
      phone: '+1 555-999-0000',
      billingAddress: '500 Logistics Park',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      taxNumber: 'US-CRM-999',
    };

    (prisma as any).$transaction = async (callback: any) => {
      const mockTx = {
        user: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            userCreated = { id: 'user-uuid-2', ...data };
            return userCreated;
          },
        },
        customer: {
          findUnique: async ({ where }: any) => {
            if (where.email === 'preexisting.crm@example.com') {
              return existingCrmCustomer;
            }
            return null;
          },
          create: async ({ data }: any) => {
            customerCreated = data;
            return { id: 'unexpected-id', ...data };
          },
          update: async ({ where, data }: any) => {
            customerUpdated = { id: where.id, ...data };
            return { ...existingCrmCustomer, ...data };
          },
        },
      };
      return callback(mockTx);
    };

    const res2 = await authService.registerCustomer({
      email: 'preexisting.crm@example.com',
      password: 'SecurePassword@2026',
      firstName: 'Robert',
      lastName: 'Smith',
      companyName: 'Pre-existing Global Logistics Ltd',
      phone: '+1 555-999-0000',
      billingAddress: '500 Logistics Park, Suite 4',
    });

    assert(userCreated !== null, 'Creates User record with Role.CUSTOMER');
    assert(userCreated.role === Role.CUSTOMER, 'Enforces Role.CUSTOMER on created account');
    assert(customerCreated === null, 'Does NOT create a duplicate Customer record');
    assert(customerUpdated !== null, 'Updates existing CRM Customer record');
    assert(customerUpdated.id === 'crm-cust-99', 'Updates matching CRM Customer by unique ID');
    assert(customerUpdated.userId === 'user-uuid-2', 'Successfully links existing Customer to new User ID');
    assert(res2.user.customerId === 'crm-cust-99', 'Returns existing CRM Customer ID in session response');

    // -------------------------------------------------------------------------
    // TEST 3: Already-Linked Customer Registration Rejection
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 3: Already-Linked Customer Registration Rejection');
    userCreated = null;

    const alreadyLinkedCustomer = {
      id: 'crm-cust-100',
      userId: 'already-linked-user-uuid',
      companyName: 'Linked Corp',
      email: 'linked.cust@example.com',
    };

    (prisma as any).$transaction = async (callback: any) => {
      const mockTx = {
        user: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            userCreated = data;
            return { id: 'err-user', ...data };
          },
        },
        customer: {
          findUnique: async () => alreadyLinkedCustomer,
          create: async () => ({ id: 'never' }),
          update: async () => ({ id: 'never' }),
        },
      };
      return callback(mockTx);
    };

    let alreadyLinkedRejected = false;
    let rejectionCode = '';
    try {
      await authService.registerCustomer({
        email: 'linked.cust@example.com',
        password: 'SecurePassword@2026',
        firstName: 'Hacked',
        lastName: 'Attempt',
        companyName: 'Linked Corp',
        phone: '+1 555-000-0000',
        billingAddress: '123 Fake St',
      });
    } catch (err: any) {
      alreadyLinkedRejected = true;
      rejectionCode = err.code;
    }

    assert(alreadyLinkedRejected, 'Safely rejects registration for customer profile already linked to a user');
    assert(rejectionCode === 'CUSTOMER_ALREADY_LINKED', 'Returns CUSTOMER_ALREADY_LINKED error code');
    assert(userCreated === null, 'Ensures no User record was created upon rejection');

    // -------------------------------------------------------------------------
    // TEST 4: Duplicate Email in User Table Handling
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 4: Duplicate Email in User Table Handling');
    userCreated = null;

    (prisma as any).$transaction = async (callback: any) => {
      const mockTx = {
        user: {
          findUnique: async () => ({ id: 'existing-user-id', email: 'existing.user@example.com' }),
          create: async ({ data }: any) => {
            userCreated = data;
            return { id: 'err-user', ...data };
          },
        },
        customer: {
          findUnique: async () => null,
          create: async () => ({ id: 'never' }),
          update: async () => ({ id: 'never' }),
        },
      };
      return callback(mockTx);
    };

    let duplicateUserRejected = false;
    let duplicateCode = '';
    try {
      await authService.registerCustomer({
        email: 'existing.user@example.com',
        password: 'SecurePassword@2026',
        firstName: 'Duplicate',
        lastName: 'Test',
        companyName: 'Duplicate Inc',
        phone: '+1 555-000-1111',
        billingAddress: '100 Main St',
      });
    } catch (err: any) {
      duplicateUserRejected = true;
      duplicateCode = err.code;
    }

    assert(duplicateUserRejected, 'Rejects registration when email exists in User table');
    assert(duplicateCode === 'EMAIL_EXISTS', 'Returns EMAIL_EXISTS error code');
    assert(userCreated === null, 'Ensures no User record was created');

    // -------------------------------------------------------------------------
    // TEST 5: Transaction Rollback on Failure
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 5: Transaction Rollback Behavior on Failure');
    let rollbackDetected = false;

    (prisma as any).$transaction = async (callback: any) => {
      const mockTx = {
        user: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            return { id: 'temp-user', ...data };
          },
        },
        customer: {
          findUnique: async () => null,
          create: async () => {
            throw new Error('Database disk write error or constraint failure simulation');
          },
          update: async () => ({ id: 'never' }),
        },
      };
      // In Prisma transactions, if the callback throws, Prisma aborts the transaction
      try {
        return await callback(mockTx);
      } catch (e: any) {
        rollbackDetected = true;
        throw e;
      }
    };

    let txFailed = false;
    try {
      await authService.registerCustomer({
        email: 'rollback.test@example.com',
        password: 'SecurePassword@2026',
        firstName: 'Rollback',
        lastName: 'Test',
        companyName: 'Fail Corp',
        phone: '+1 555-222-3333',
        billingAddress: '99 Crash Way',
      });
    } catch (err: any) {
      txFailed = true;
    }

    assert(txFailed, 'Throws exception when database error occurs during transaction');
    assert(rollbackDetected, 'Transaction callback aborts and rolls back completely');

    // -------------------------------------------------------------------------
    // TEST 6: Public Registration Cannot Create ADMIN or STAFF
    // -------------------------------------------------------------------------
    console.log('\n📦 Test 6: Role Security (Cannot Create ADMIN or STAFF)');
    let capturedRole: any = null;

    (prisma as any).$transaction = async (callback: any) => {
      const mockTx = {
        user: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            capturedRole = data.role;
            return { id: 'role-test-user', ...data };
          },
        },
        customer: {
          findUnique: async () => null,
          create: async ({ data }: any) => ({ id: 'role-test-cust', ...data }),
          update: async () => ({ id: 'never' }),
        },
      };
      return callback(mockTx);
    };

    // Even if malicious payload attempts to inject role = 'ADMIN'
    const maliciousPayload: any = {
      email: 'attacker@example.com',
      password: 'SecurePassword@2026',
      firstName: 'Attacker',
      lastName: 'User',
      companyName: 'Hacker LLC',
      phone: '+1 555-999-9999',
      billingAddress: '0x00 Null Island',
      role: 'ADMIN', // Injection attempt
    };

    await authService.registerCustomer(maliciousPayload);
    assert(capturedRole === Role.CUSTOMER, 'Public registration strictly assigns Role.CUSTOMER regardless of payload');

    console.log('\n================================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

  } finally {
    // Restore original transaction method
    prisma.$transaction = originalTransaction;
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runRegistrationLinkingTests().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});

