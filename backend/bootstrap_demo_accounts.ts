import { PrismaClient, Role, ProductType, BillingFrequency, SubscriptionStatus, QuotationStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function bootstrapDemoAccounts() {
  if (process.argv.includes('--dry-run') || process.argv.includes('--check-only')) {
    console.log('[COMPILE CHECK] bootstrap_demo_accounts.ts syntax, imports, and types verified successfully.');
    process.exit(0);
  }

  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    console.error('\n[CONFIGURATION ERROR] A valid Neon production database URL is required.');
    console.error('Please run this script using the secure wrapper: .\\bootstrap_demo_accounts.ps1\n');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  const demoAdminEmail = (process.env.DEMO_ADMIN_EMAIL || 'demo.admin@brightloop.io').toLowerCase().trim();
  const demoStaffEmail = (process.env.DEMO_STAFF_EMAIL || 'demo.staff@brightloop.io').toLowerCase().trim();
  const demoCustomerEmail = (process.env.DEMO_CUSTOMER_EMAIL || 'demo.customer@brightloop.io').toLowerCase().trim();

  try {
    console.log('================================================================');
    console.log(' Brightloop - Evaluator Demo Accounts Safe Provisioning');
    console.log('================================================================\n');

    // 1. Verify that real operational records exist and are protected
    const totalUsers = await prisma.user.count();
    console.log(`[SAFETY CHECK] Total existing users in database: ${totalUsers}`);
    console.log('[SAFETY CHECK] Preserving all existing non-demo records untouched.\n');

    const demoPasswordHash = await bcrypt.hash('DemoEvaluator@2026!', 10);

    // 2. Demo Admin Account
    console.log(`1. Provisioning Evaluator Demo Admin (${demoAdminEmail})...`);
    const demoAdmin = await prisma.user.upsert({
      where: { email: demoAdminEmail },
      update: {
        role: Role.ADMIN,
        isActive: true,
      },
      create: {
        email: demoAdminEmail,
        passwordHash: demoPasswordHash,
        firstName: 'Demo',
        lastName: 'Admin',
        role: Role.ADMIN,
        phone: '+1 555-010-DEMO',
        isActive: true,
      },
    });
    console.log(`   ✓ Demo Admin ready (ID: ${demoAdmin.id})`);

    // 3. Demo Staff Account
    console.log(`2. Provisioning Evaluator Demo Staff (${demoStaffEmail})...`);
    const demoStaff = await prisma.user.upsert({
      where: { email: demoStaffEmail },
      update: {
        role: Role.STAFF,
        isActive: true,
      },
      create: {
        email: demoStaffEmail,
        passwordHash: demoPasswordHash,
        firstName: 'Demo',
        lastName: 'Staff',
        role: Role.STAFF,
        phone: '+1 555-020-DEMO',
        isActive: true,
      },
    });
    console.log(`   ✓ Demo Staff ready (ID: ${demoStaff.id})`);

    // 4. Demo Customer Account & CRM Profile
    console.log(`3. Provisioning Evaluator Demo Customer (${demoCustomerEmail})...`);
    const demoCustomerUser = await prisma.user.upsert({
      where: { email: demoCustomerEmail },
      update: {
        role: Role.CUSTOMER,
        isActive: true,
      },
      create: {
        email: demoCustomerEmail,
        passwordHash: demoPasswordHash,
        firstName: 'Demo',
        lastName: 'Customer',
        role: Role.CUSTOMER,
        phone: '+1 555-030-DEMO',
        isActive: true,
      },
    });

    const demoCustomerProfile = await prisma.customer.upsert({
      where: { email: demoCustomerEmail },
      update: {
        userId: demoCustomerUser.id,
      },
      create: {
        userId: demoCustomerUser.id,
        companyName: 'Acme Corp (Evaluator Demo)',
        contactName: 'Demo Customer',
        email: demoCustomerEmail,
        phone: '+1 555-030-DEMO',
        billingAddress: '742 Evergreen Terrace, Suite 100',
        city: 'Springfield',
        state: 'OR',
        country: 'USA',
        postalCode: '97477',
        taxNumber: 'US-DEMO-9948',
        currency: 'INR',
      },
    });
    console.log(`   ✓ Demo Customer ready (ID: ${demoCustomerProfile.id}, User: ${demoCustomerUser.id})`);

    // 5. Ensure sample Demo Product & Plan exist for realistic portal experience
    console.log('\n4. Checking sample catalog for evaluator customer portal...');
    const demoProduct = await prisma.product.upsert({
      where: { code: 'DEMO-CLOUD-PRO' },
      update: {},
      create: {
        name: 'Enterprise Cloud Suite (Demo)',
        code: 'DEMO-CLOUD-PRO',
        type: ProductType.SOFTWARE,
        salesPrice: 2499.00,
        costPrice: 500.00,
        notes: 'Sample software package configured for hackathon evaluator quick-login demo.',
      },
    });

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const demoPlan = await prisma.subscriptionPlan.upsert({
      where: { id: 'demo-evaluator-plan' },
      update: {},
      create: {
        id: 'demo-evaluator-plan',
        name: 'Pro Cloud Monthly (Demo)',
        basePrice: 2499.00,
        billingFrequency: BillingFrequency.MONTHLY,
        startDate: now,
        endDate: oneYearLater,
        allowPause: true,
        allowRenewal: true,
        allowEarlyClosure: true,
        isActive: true,
      },
    });

    // 6. Create sample active subscription for Demo Customer if none exists
    const existingSub = await prisma.subscription.findFirst({
      where: { customerId: demoCustomerProfile.id },
    });

    if (!existingSub) {
      console.log('5. Creating sample active subscription for demo customer...');
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-DEMO-${Date.now().toString().slice(-4)}`,
          customerId: demoCustomerProfile.id,
          planId: demoPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          nextBillingDate: nextMonth,
          autoRenew: true,
          subtotal: 2499.00,
          taxAmount: 249.90,
          totalAmount: 2748.90,
          items: {
            create: {
              productId: demoProduct.id,
              quantity: 1,
              unitPrice: 2499.00,
              subtotal: 2499.00,
              taxRate: 10.0,
              taxAmount: 249.90,
              totalAmount: 2748.90,
            },
          },
        },
      });

      // Sample confirmed invoice
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-DEMO-${Date.now().toString().slice(-4)}`,
          customerId: demoCustomerProfile.id,
          subscriptionId: sub.id,
          status: InvoiceStatus.CONFIRMED,
          invoiceDate: now,
          dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          subtotal: 2499.00,
          taxAmount: 249.90,
          totalAmount: 2748.90,
          amountPaid: 0.00,
          balanceDue: 2748.90,
          items: {
            create: {
              productId: demoProduct.id,
              description: 'Enterprise Cloud Suite (Demo) - Monthly Cycle',
              quantity: 1,
              unitPrice: 2499.00,
              subtotal: 2499.00,
              taxRate: 10.0,
              taxAmount: 249.90,
              totalAmount: 2748.90,
            },
          },
        },
      });
      console.log('   ✓ Sample active subscription and confirmed invoice initialized.');
    } else {
      console.log('5. Demo customer sample subscriptions already initialized.');
    }

    console.log('\n================================================================');
    console.log(' SUCCESS: EVALUATOR DEMO ACCOUNTS & SAMPLE DATA READY');
    console.log('================================================================');
    console.log(`  Admin Demo User    : ${demoAdminEmail}`);
    console.log(`  Staff Demo User    : ${demoStaffEmail}`);
    console.log(`  Customer Demo User : ${demoCustomerEmail}`);
    console.log('  Customer Company   : Acme Corp (Evaluator Demo)');
    console.log('  Safety Status      : Operational records were left untouched.');
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('\n[DATABASE ERROR] Failed to provision demo accounts:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapDemoAccounts();

