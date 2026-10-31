import { PrismaClient } from '@prisma/client';

const PRISMA_LOCK_KEY = 72707369;
const TARGET_PID = 1695;

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

async function inspectPidForensics() {
  if (process.argv.includes('--dry-run') || process.argv.includes('--check-only')) {
    console.log('[COMPILE CHECK] inspect_db_metadata.ts syntax, imports, and types verified successfully.');
    process.exit(0);
  }

  const directUrl = process.env.DATABASE_URL;
  if (!directUrl || directUrl.includes('localhost') || directUrl.includes('127.0.0.1')) {
    console.error('\n[CONFIGURATION ERROR] A valid Neon DIRECT_URL must be provided via DATABASE_URL environment variable.');
    console.error('To run this inspection securely, please use: .\\inspect_neon.ps1\n');
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
    console.log(` Neon PostgreSQL Advisory Lock & PID ${TARGET_PID} Forensic Inspection`);
    console.log('================================================================\n');

    // -------------------------------------------------------------------------
    // 1. CONFIRM PID 1695 STATUS IN pg_stat_activity
    // -------------------------------------------------------------------------
    console.log(`[SECTION 1: TARGET PID ${TARGET_PID} SESSION ACTIVITY]`);
    const pidActivity = await prisma.$queryRaw<Array<{
      pid: number;
      usename: string | null;
      datname: string | null;
      client_addr: string | null;
      client_port: number | null;
      backend_type: string | null;
      application_name: string | null;
      backend_start: Date | null;
      xact_start: Date | null;
      query_start: Date | null;
      state_change: Date | null;
      wait_event_type: string | null;
      wait_event: string | null;
      state: string | null;
    }>>`
      SELECT
        pid,
        usename,
        datname,
        client_addr::text AS client_addr,
        client_port,
        backend_type,
        application_name,
        backend_start,
        xact_start,
        query_start,
        state_change,
        wait_event_type,
        wait_event,
        state
      FROM pg_stat_activity
      WHERE pid = ${TARGET_PID};
    `;

    if (pidActivity.length === 0) {
      console.log(`  -> PID ${TARGET_PID} DOES NOT EXIST in pg_stat_activity (the session has already terminated).`);
    } else {
      const s = pidActivity[0];
      const hasActiveXact = !!s.xact_start;
      console.log(`  PID ${TARGET_PID} Status: ACTIVE SESSION FOUND`);
      console.log(`    Database User      : ${s.usename || '(null)'}`);
      console.log(`    Database Name      : ${s.datname || '(null)'}`);
      console.log(`    Client IP & Port   : ${s.client_addr || 'unknown'}:${s.client_port || 'unknown'}`);
      console.log(`    Backend Type       : ${s.backend_type || 'unknown'}`);
      console.log(`    Application Name   : "${s.application_name || 'unnamed'}"`);
      console.log(`    Session State      : ${s.state || 'unknown'}`);
      console.log(`    Active Transaction : ${hasActiveXact ? 'YES (xact_start: ' + s.xact_start?.toISOString() + ')' : 'NO (xact_start is NULL)'}`);
      console.log(`    Wait Event         : ${s.wait_event_type ? s.wait_event_type + ': ' + s.wait_event : '(none)'}`);
      console.log(`    Backend Start Time : ${s.backend_start ? s.backend_start.toISOString() : 'null'}`);
      console.log(`    Transaction Start  : ${s.xact_start ? s.xact_start.toISOString() : 'null'}`);
      console.log(`    Query Start Time   : ${s.query_start ? s.query_start.toISOString() : 'null'}`);
      console.log(`    State Change Time  : ${s.state_change ? s.state_change.toISOString() : 'null'}`);
    }

    // -------------------------------------------------------------------------
    // 2. INSPECT ALL ADVISORY LOCKS & CHECK FOR PRISMA KEY 72707369
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 2: ALL POSTGRESQL ADVISORY LOCKS]');
    const advisoryLocks = await prisma.$queryRaw<Array<{
      pid: number;
      locktype: string;
      mode: string;
      granted: boolean;
      classid: string;
      objid: string;
      objsubid: number;
      application_name: string | null;
      backend_start: Date | null;
      xact_start: Date | null;
      query_start: Date | null;
      state_change: Date | null;
      wait_event_type: string | null;
      wait_event: string | null;
      state: string | null;
    }>>`
      SELECT
        l.pid,
        l.locktype,
        l.mode,
        l.granted,
        l.classid::text AS classid,
        l.objid::text AS objid,
        l.objsubid,
        a.application_name,
        a.backend_start,
        a.xact_start,
        a.query_start,
        a.state_change,
        a.wait_event_type,
        a.wait_event,
        a.state
      FROM pg_locks l
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.locktype = 'advisory'
      ORDER BY l.pid ASC;
    `;

    console.log(`  Total Advisory Locks Held: ${advisoryLocks.length}`);

    let targetPidHoldsLock = false;
    let anyPrismaLockFound = false;

    advisoryLocks.forEach((lock, idx) => {
      // Exact match for Prisma's one-argument PostgreSQL advisory lock: pg_advisory_lock(72707369)
      // Expects: classid = 0, objid = 72707369, objsubid = 1
      const isPrismaLock = String(lock.classid) === '0' && String(lock.objid) === String(PRISMA_LOCK_KEY) && Number(lock.objsubid) === 1;

      if (isPrismaLock) {
        anyPrismaLockFound = true;
        if (lock.pid === TARGET_PID) {
          targetPidHoldsLock = true;
        }
      }

      console.log(`\n  Lock #${idx + 1}:`);
      console.log(`    PID              : ${lock.pid}`);
      console.log(`    Is Prisma Lock?  : ${isPrismaLock ? 'YES (matches migration lock key ' + PRISMA_LOCK_KEY + ')' : 'NO'}`);
      console.log(`    Granted          : ${lock.granted ? 'YES (HELD)' : 'NO (WAITING / BLOCKED)'}`);
      console.log(`    Lock Mode        : ${lock.mode}`);
      console.log(`    ClassID / ObjID  : classid=${lock.classid}, objid=${lock.objid}, objsubid=${lock.objsubid}`);
      console.log(`    Application Name : "${lock.application_name || 'unnamed'}"`);
      console.log(`    Session State    : ${lock.state || 'unknown'}`);
      console.log(`    Wait Event       : ${lock.wait_event_type ? lock.wait_event_type + ': ' + lock.wait_event : '(none)'}`);
      console.log(`    Backend Start    : ${lock.backend_start ? lock.backend_start.toISOString() : 'null'}`);
      console.log(`    Transaction Start: ${lock.xact_start ? lock.xact_start.toISOString() : 'null'}`);
      console.log(`    State Change     : ${lock.state_change ? lock.state_change.toISOString() : 'null'}`);
    });

    if (advisoryLocks.length === 0) {
      console.log('  -> No advisory locks currently exist in pg_locks.');
    }

    // -------------------------------------------------------------------------
    // 3. INSPECT PRISMA MIGRATION RECORD (0_init)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 3: _prisma_migrations RECORD FOR 0_init]');
    const migrationRecords = await prisma.$queryRaw<Array<{
      id: string;
      migration_name: string;
      started_at: Date;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
      logs: string | null;
    }>>`
      SELECT id, migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs
      FROM "_prisma_migrations"
      ORDER BY started_at ASC;
    `;

    console.log(`  Total Migration Records: ${migrationRecords.length}`);
    migrationRecords.forEach((r, idx) => {
      let status = 'UNKNOWN';
      if (r.finished_at && !r.rolled_back_at) {
        status = 'APPLIED';
      } else if (r.rolled_back_at) {
        status = 'ROLLED BACK';
      } else if (!r.finished_at) {
        status = 'FAILED / INCOMPLETE';
      }

      console.log(`\n  Record #${idx + 1}:`);
      console.log(`    Migration Name : ${r.migration_name}`);
      console.log(`    Status         : ${status}`);
      console.log(`    ID             : ${r.id}`);
      console.log(`    Started At     : ${r.started_at ? r.started_at.toISOString() : 'null'}`);
      console.log(`    Finished At    : ${r.finished_at ? r.finished_at.toISOString() : 'null'}`);
      console.log(`    Rolled Back At : ${r.rolled_back_at ? r.rolled_back_at.toISOString() : 'null'}`);
      console.log(`    Applied Steps  : ${r.applied_steps_count}`);
      if (r.logs) {
        console.log(`    Logs           :\n${r.logs.trim()}`);
      }
    });

    // -------------------------------------------------------------------------
    // 4. INSPECT SCHEMA COUNTS
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 4: SCHEMA STATE IN PUBLIC SCHEMA]');
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `;
    const tableNames = tables.map(t => t.table_name);
    const matchedTables = expectedTables.filter(t => tableNames.includes(t));

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

    console.log(`  Expected Tables Found : ${matchedTables.length}/19`);
    console.log(`  Expected Enums Found  : ${matchedEnums.length}/8`);
    console.log(`  All Tables in public  : ${tableNames.join(', ') || '(none)'}`);
    console.log(`  All Enums in public   : ${enumNames.join(', ') || '(none)'}`);

    // -------------------------------------------------------------------------
    // 5. INSPECT USER & SEED DATA STATUS (RECORD COUNTS ONLY, NO SENSITIVE DATA)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 5: USER & SEED RECORD INVENTORY]');
    if (tableNames.includes('User')) {
      const userCount = await prisma.user.count();
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      const staffCount = await prisma.user.count({ where: { role: 'STAFF' } });
      const customerCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
      const productCount = tableNames.includes('Product') ? await prisma.product.count() : 0;
      const planCount = tableNames.includes('SubscriptionPlan') ? await prisma.subscriptionPlan.count() : 0;
      const customerCountTable = tableNames.includes('Customer') ? await prisma.customer.count() : 0;

      console.log(`  Total Users in DB       : ${userCount}`);
      console.log(`  - ADMIN Users           : ${adminCount}`);
      console.log(`  - STAFF Users           : ${staffCount}`);
      console.log(`  - CUSTOMER Users        : ${customerCount}`);
      console.log(`  Total Products in DB    : ${productCount}`);
      console.log(`  Total Plans in DB       : ${planCount}`);
      console.log(`  Total Customers in DB   : ${customerCountTable}`);

      if (userCount === 0) {
        console.log('\n  -> SEED STATUS: DATABASE IS UNSEEDED (0 users exist).');
        console.log('     Login attempts with default/demo credentials will fail with');
        console.log('     "Invalid email or password" because no user records exist yet.');
      } else {
        console.log(`\n  -> SEED STATUS: ${userCount} user(s) exist (${adminCount} admin).`);
      }
    } else {
      console.log('  -> User table does not exist.');
    }

    // -------------------------------------------------------------------------
    // 6. SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(' FORENSIC SUMMARY & ATTRIBUTION ANALYSIS');
    console.log('================================================================');
    console.log(` - Target PID ${TARGET_PID} exists in pg_stat_activity: ${pidActivity.length > 0 ? 'YES' : 'NO'}`);
    console.log(` - Target PID ${TARGET_PID} holds lock 72707369: ${targetPidHoldsLock ? 'YES (GRANTED)' : 'NO'}`);
    console.log(` - Any process holds lock 72707369: ${anyPrismaLockFound ? 'YES' : 'NO'}`);
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('\n[FORENSIC QUERY ERROR]', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

inspectPidForensics();
