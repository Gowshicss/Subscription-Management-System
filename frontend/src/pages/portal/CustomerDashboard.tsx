import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Repeat, Receipt, FileText, ArrowRight, Calendar, CreditCard } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-portal-summary'],
    queryFn: () => api.get<any>('/dashboard/summary'),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted">Loading customer portal...</div>;
  }

  const metrics = data?.metrics || {};
  const activeSubs = data?.activeSubscriptions || [];
  const quotes = data?.recentQuotations || [];
  const invoices = data?.recentInvoices || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          CUSTOMER SELF-SERVICE PORTAL
        </h1>
        <p className="text-xs text-muted font-medium">
          Manage your software subscriptions, approve quotation proposals, and review invoices
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptionsCount || 0}
          subtitle="Currently active plans"
          icon={Repeat}
          badge="Active"
          badgeType="success"
        />
        <MetricCard
          title="Outstanding Balance"
          value={`$${Number(metrics.totalOutstanding || 0).toFixed(2)}`}
          subtitle="Total due across invoices"
          icon={Receipt}
          badge={metrics.totalOutstanding > 0 ? 'Due' : 'All Paid'}
          badgeType={metrics.totalOutstanding > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Pending Quotations"
          value={metrics.pendingQuotesCount || 0}
          subtitle="Awaiting your approval"
          icon={FileText}
          badge={metrics.pendingQuotesCount > 0 ? 'Actionable' : 'None'}
          badgeType={metrics.pendingQuotesCount > 0 ? 'info' : 'success'}
        />
        <MetricCard
          title="Next Billing Date"
          value={metrics.nextBillingDate ? new Date(metrics.nextBillingDate).toLocaleDateString() : 'N/A'}
          subtitle="Upcoming scheduled cycle"
          icon={Calendar}
        />
      </div>

      {/* Active Subscriptions Overview */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
            Your Active Subscriptions
          </h2>
          <Link to="/portal/subscriptions" className="text-xs text-teal-accent hover:underline font-semibold flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Subscription #</th>
                <th>Plan Name</th>
                <th>Frequency</th>
                <th>Next Billing Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSubs.map((sub: any) => (
                <tr key={sub.id}>
                  <td className="font-mono font-bold text-xs text-plum">{sub.subscriptionNumber}</td>
                  <td className="text-xs font-medium">{sub.plan?.name}</td>
                  <td className="text-xs text-muted uppercase">{sub.plan?.billingFrequency}</td>
                  <td className="text-xs font-mono">{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                  <td className="text-xs font-bold">${Number(sub.totalAmount).toFixed(2)}</td>
                  <td>
                    <StatusBadge status={sub.status} size="sm" />
                  </td>
                </tr>
              ))}
              {activeSubs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-xs text-muted">
                    You do not have any active subscriptions right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column: Pending Quotations & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Quotations */}
        <div className="brutalist-card bg-white border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Pending Offers & Quotations
            </h2>
            <Link to="/portal/quotations" className="text-xs text-teal-accent hover:underline font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {quotes.map((q: any) => (
              <div
                key={q.id}
                className="p-3 border border-border rounded flex items-center justify-between hover:bg-surface-secondary transition-colors"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-plum block">{q.quotationNumber}</span>
                  <span className="text-[11px] text-muted block">
                    Valid until {new Date(q.validUntil).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-bold text-charcoal mt-1 block">
                    Total: ${Number(q.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={q.status} size="sm" />
                  {q.status === 'SENT' && (
                    <Link
                      to="/portal/quotations"
                      className="brutalist-btn-primary text-xs py-1 px-2.5"
                    >
                      Review & Accept
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {quotes.length === 0 && (
              <p className="text-xs text-muted text-center py-4">No quotations available.</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="brutalist-card bg-white border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Recent Invoices
            </h2>
            <Link to="/portal/invoices" className="text-xs text-teal-accent hover:underline font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-3 border border-border rounded flex items-center justify-between hover:bg-surface-secondary transition-colors"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-charcoal block">{inv.invoiceNumber}</span>
                  <span className="text-[11px] text-muted block">
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-bold text-charcoal mt-1 block">
                    Amount: ${Number(inv.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <StatusBadge status={inv.status} size="sm" />
                  <span className="text-xs font-semibold text-red-600 block mt-1">
                    Balance: ${Number(inv.balanceDue).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-xs text-muted text-center py-4">No invoices on record.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
