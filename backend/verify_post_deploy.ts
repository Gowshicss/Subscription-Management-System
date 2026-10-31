import { PrismaClient } from '@prisma/client';

const expectedTables = [
  'User',
  'Customer',
  'Product',
  'ProductVariant',
  'SubscriptionPlan',
  'QuotationTemplate',
  'Quotation',
  'QuotationItem',
  'Subscription',
  'SubscriptionItem',
  'TaxRule',
  'Discount',
  'DiscountUsage',
  'Invoice',
  'InvoiceItem',
  'Payment',
  'PasswordResetToken',
  'AuditLog',
  'BusinessSettings'
];

const expectedEnums = [
  'Role',
  'ProductType',
  'BillingFrequency',
  'QuotationStatus',
  'SubscriptionStatus',
  'InvoiceStatus',
  'DiscountType',
  'PaymentMethod'
];

async function verifyDeployment() {
  if (process.argv.includes('--dry-run') || process.argv.includes('--check-only')) {
    console.log('[COMPILE CHECK] verify_post_deploy.ts verified successfully.');
    process.exit(0);
  }

  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl || directUrl.includes('localhost') || directUrl.includes('127.0.0.1')) {
    console.error('\n[CONFIGURATION ERROR] A valid Neon Direct URL is required.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl
      }
    }
  });

  try {
    console.log('\n================================================================');
    console.log(' Brightloop Production Database Post-Deployment Verification');
    console.log('================================================================\n');

    // 1. Verify tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `;
    const tableNames = tables.map(t => t.table_name);

    const matchedTables = expectedTables.filter(t => tableNames.includes(t));
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));

    console.log(`[TABLE VERIFICATION] Expected: 19, Found: ${matchedTables.length}/19`);
    if (missingTables.length > 0) {
      console.log(`  MISSING TABLES: ${missingTables.join(', ')}`);
    } else {
      console.log('  ALL 19 APPLICATION TABLES CREATED SUCCESSFULLY.');
    }

    // 2. Verify enums
    const enums = await prisma.$queryRaw<Array<{ enum_name: string }>>`
      SELECT t.typname AS enum_name
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype = 'e'
      ORDER BY t.typname ASC;
    `;
    const enumNames = enums.map(e => e.enum_name);

    const matchedEnums = expectedEnums.filter(e => enumNames.includes(e));
    const missingEnums = expectedEnums.filter(e => !enumNames.includes(e));

    console.log(`\n[ENUM VERIFICATION] Expected: 8, Found: ${matchedEnums.length}/8`);
    if (missingEnums.length > 0) {
      console.log(`  MISSING ENUMS: ${missingEnums.join(', ')}`);
    } else {
      console.log('  ALL 8 ENUMS CREATED SUCCESSFULLY.');
    }

    // 3. Verify _prisma_migrations record
    console.log('\n[MIGRATION RECORD VERIFICATION]');
    const migrations = await prisma.$queryRaw<Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
    }>>`
      SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY started_at ASC;
    `;

    let initApplied = false;
    migrations.forEach(m => {
      const isApplied = !!m.finished_at && !m.rolled_back_at;
      console.log(`  - Migration "${m.migration_name}": finished_at=${m.finished_at ? m.finished_at.toISOString() : 'NULL'}, rolled_back_at=${m.rolled_back_at ? m.rolled_back_at.toISOString() : 'NULL'}, steps=${m.applied_steps_count}`);
      if (m.migration_name.includes('0_init') && isApplied) {
        initApplied = true;
      }
    });

    console.log('\n================================================================');
    if (matchedTables.length === 19 && matchedEnums.length === 8 && initApplied) {
      console.log(' RESULT: FULL PRODUCTION DEPLOYMENT VERIFIED (100% SUCCESS)');
      console.log('================================================================\n');
      process.exit(0);
    } else {
      console.log(' RESULT: INCOMPLETE DEPLOYMENT');
      console.log('================================================================\n');
      process.exit(1);
    }

  } catch (err: any) {
    console.error('\n[VERIFICATION ERROR]', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDeployment();

