import { prisma } from '../lib/prisma';
import { SubscriptionStatus, InvoiceStatus, Role, BillingFrequency } from '@prisma/client';

class DashboardService {
  async getAdminFinanceSummary() {
    const now = new Date();

    // 1. Parallel aggregates
    const [
      activeSubsCount,
      totalCustomersCount,
      activeSubscriptions,
      allPayments,
      invoices,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.customer.count(),
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        include: { plan: true },
      }),
      prisma.payment.findMany({
        select: { amount: true, paymentDate: true },
      }),
      prisma.invoice.findMany({
        where: { status: { not: InvoiceStatus.CANCELLED } },
        select: {
          id: true,
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
          dueDate: true,
          status: true,
        },
      }),
    ]);

    // Financial totals computed from records
    const totalRevenueReceived = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalInvoicedAmount = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const totalOutstandingAmount = invoices.reduce((acc, inv) => acc + Number(inv.balanceDue), 0);

    const overdueInvoices = invoices.filter(
      (inv) => inv.status !== InvoiceStatus.PAID && new Date(inv.dueDate) < now && Number(inv.balanceDue) > 0
    );
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((acc, inv) => acc + Number(inv.balanceDue), 0);

    // Calculate MRR (Monthly Recurring Revenue) & ARR
    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const subTotal = Number(sub.totalAmount);
      switch (sub.plan.billingFrequency) {
        case BillingFrequency.DAILY:
          mrr += subTotal * 30;
          break;
        case BillingFrequency.WEEKLY:
          mrr += (subTotal * 52) / 12;
          break;
        case BillingFrequency.MONTHLY:
          mrr += subTotal;
          break;
        case BillingFrequency.YEARLY:
          mrr += subTotal / 12;
          break;
      }
    }
    const arr = mrr * 12;

    // Revenue Trend: Aggregate payments by Month (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendMap: Record<string, { month: string; revenue: number; invoices: number }> = {};

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthlyTrendMap[key] = { month: key, revenue: 0, invoices: 0 };
    }

    for (const p of allPayments) {
      const pDate = new Date(p.paymentDate);
      const key = `${monthNames[pDate.getMonth()]} ${pDate.getFullYear().toString().slice(2)}`;
      if (monthlyTrendMap[key]) {
        monthlyTrendMap[key].revenue += Number(p.amount);
      }
    }

    for (const inv of invoices) {
      const iDate = new Date(inv.dueDate);
      const key = `${monthNames[iDate.getMonth()]} ${iDate.getFullYear().toString().slice(2)}`;
      if (monthlyTrendMap[key]) {
        monthlyTrendMap[key].invoices += Number(inv.totalAmount);
      }
    }

    // Subscription status breakdown
    const statusGroups = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const subscriptionBreakdown = statusGroups.map((g) => ({
      status: g.status,
      count: g._count.id,
    }));

    // Recent 5 invoices and payments
    const [recentInvoices, recentPayments] = await Promise.all([
      prisma.invoice.findMany({
        take: 5,
        orderBy: { invoiceDate: 'desc' },
        include: {
          customer: { select: { companyName: true } },
          subscription: { select: { subscriptionNumber: true } },
        },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { companyName: true } },
          invoice: { select: { invoiceNumber: true } },
        },
      }),
    ]);

    return {
      metrics: {
        activeSubscriptions: activeSubsCount,
        totalCustomers: totalCustomersCount,
        totalRevenueReceived,
        totalInvoicedAmount,
        totalOutstandingAmount,
        overdueCount,
        overdueAmount,
        mrr,
        arr,
      },
      charts: {
        revenueTrend: Object.values(monthlyTrendMap),
        subscriptionBreakdown,
      },
      recentActivity: {
        recentInvoices,
        recentPayments,
      },
    };
  }

  async getCustomerPortalSummary(customerId: string) {
    const now = new Date();

    const [
      activeSubs,
      quotations,
      invoices,
      payments,
    ] = await Promise.all([
      prisma.subscription.findMany({
        where: { customerId, status: SubscriptionStatus.ACTIVE },
        include: { plan: true },
        orderBy: { nextBillingDate: 'asc' },
      }),
      prisma.quotation.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { customerId, status: { not: InvoiceStatus.CANCELLED } },
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.payment.findMany({
        where: { customerId },
        orderBy: { paymentDate: 'desc' },
        take: 5,
      }),
    ]);

    const totalOutstanding = invoices.reduce((acc, inv) => acc + Number(inv.balanceDue), 0);
    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const pendingQuotes = quotations.filter((q) => q.status === 'SENT').length;
    const nextBillingDate = activeSubs[0]?.nextBillingDate || null;

    return {
      metrics: {
        activeSubscriptionsCount: activeSubs.length,
        totalOutstanding,
        totalPaid,
        pendingQuotesCount: pendingQuotes,
        nextBillingDate,
      },
      activeSubscriptions: activeSubs,
      recentQuotations: quotations,
      recentInvoices: invoices.slice(0, 5),
      recentPayments: payments,
    };
  }
}

export const dashboardService = new DashboardService();

