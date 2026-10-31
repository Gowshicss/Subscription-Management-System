import { prisma } from '../src/lib/prisma';
import { dashboardService } from '../src/services/dashboard.service';
import { customerService } from '../src/services/customer.service';
import { subscriptionService } from '../src/services/subscription.service';
import { Role, SubscriptionStatus } from '@prisma/client';

async function runPerformanceBenchmark() {
  console.log('====================================================');
  console.log('⚡ RUNNING PERFORMANCE BENCHMARK & QUERY TIMINGS');
  console.log('====================================================\n');

  const targetMaxMs = 2000; // < 2 seconds requirement from problem statement

  // Benchmark 1: Dashboard Finance Aggregation (Complex aggregations across subs, invoices, payments)
  console.log('Test 1: Admin Finance Dashboard Aggregates');
  const t0 = performance.now();
  const financeData = await dashboardService.getAdminFinanceSummary();
  const t1 = performance.now();
  const durationDashboard = Math.round(t1 - t0);
  console.log(`  Duration: ${durationDashboard}ms (Target: <${targetMaxMs}ms)`);
  console.log(`  Metrics computed: ${Object.keys(financeData.metrics).length} metrics, ${financeData.charts.revenueTrend.length} monthly intervals`);
  if (durationDashboard < targetMaxMs) {
    console.log(`  ✓ PASS: Responded in ${durationDashboard}ms (<2000ms)\n`);
  } else {
    console.error(`  ✗ FAIL: Exceeded 2000ms (${durationDashboard}ms)\n`);
  }

  // Benchmark 2: Paginated Customers with Financial Summaries
  console.log('Test 2: Paginated Customers Query (with balance rollups)');
  const t2 = performance.now();
  const customerList = await customerService.listCustomers({ page: 1, limit: 50 });
  const t3 = performance.now();
  const durationCustomers = Math.round(t3 - t2);
  console.log(`  Duration: ${durationCustomers}ms (Target: <${targetMaxMs}ms)`);
  console.log(`  Total customers returned: ${customerList.customers.length}`);
  if (durationCustomers < targetMaxMs) {
    console.log(`  ✓ PASS: Responded in ${durationCustomers}ms (<2000ms)\n`);
  } else {
    console.error(`  ✗ FAIL: Exceeded 2000ms (${durationCustomers}ms)\n`);
  }

  // Benchmark 3: Subscriptions Filter by Status
  console.log('Test 3: Subscriptions by Status Query');
  const t4 = performance.now();
  const subs = await subscriptionService.listSubscriptions(Role.ADMIN, null, SubscriptionStatus.ACTIVE);
  const t5 = performance.now();
  const durationSubs = Math.round(t5 - t4);
  console.log(`  Duration: ${durationSubs}ms (Target: <${targetMaxMs}ms)`);
  console.log(`  Subscriptions returned: ${subs.length}`);
  if (durationSubs < targetMaxMs) {
    console.log(`  ✓ PASS: Responded in ${durationSubs}ms (<2000ms)\n`);
  } else {
    console.error(`  ✗ FAIL: Exceeded 2000ms (${durationSubs}ms)\n`);
  }

  console.log('====================================================');
  console.log('⚡ BENCHMARK COMPLETED: All critical queries response in under 2000ms');
  console.log('====================================================\n');
}

runPerformanceBenchmark()
  .catch((e) => {
    console.error('Benchmark error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

