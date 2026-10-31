import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  DollarSign,
  Repeat,
  Users,
  AlertTriangle,
  Receipt,
  TrendingUp,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<any>('/dashboard/summary'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recent = data?.recentActivity || {};

  const COLORS = ['#4B2D47', '#79516F', '#259DA5', '#CDECEF', '#77727A'];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            Financial & Operations Dashboard
          </h1>
          <p className="text-xs text-muted font-medium mt-0.5">
            Real-time business performance derived from persistent database records
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="brutalist-btn-secondary text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refresh Records'}
        </button>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions || 0}
          subtitle="Currently recurring"
          icon={Repeat}
          badge="Live"
          badgeType="success"
        />
        <MetricCard
          title="Revenue Collected"
          value={`₹${Number(metrics.totalRevenueReceived || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Actual payments cleared"
          icon={DollarSign}
          badge="Cash In"
          badgeType="success"
        />
        <MetricCard
          title="Outstanding Receivables"
          value={`₹${Number(metrics.totalOutstandingAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`Total Invoiced: ₹${Number(metrics.totalInvoicedAmount || 0).toFixed(0)}`}
          icon={Receipt}
          badge="Unpaid"
          badgeType="warning"
        />
        <MetricCard
          title="Overdue Invoices"
          value={metrics.overdueCount || 0}
          subtitle={`At Risk: ₹${Number(metrics.overdueAmount || 0).toFixed(2)}`}
          icon={AlertTriangle}
          badge={metrics.overdueCount > 0 ? 'Action Required' : 'Clean'}
          badgeType={metrics.overdueCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Secondary ARR & Customer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Annual Run-Rate (ARR)"
          value={`₹${Number(metrics.arr || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`MRR: ₹${Number(metrics.mrr || 0).toFixed(2)} / month`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Active Customers"
          value={metrics.totalCustomers || 0}
          subtitle="Enterprise & small business accounts"
          icon={Users}
        />
        <MetricCard
          title="Gross Invoiced Amount"
          value={`₹${Number(metrics.totalInvoicedAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Total billing demand issued"
          icon={Receipt}
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Billing Demand */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-charcoal">
                Revenue & Invoicing Trend
              </h3>
              <p className="text-xs text-muted">Comparison of invoiced total vs realized revenue</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-plum bg-[#FAF9F7] px-2.5 py-1 rounded-full border border-border">
              Live Data
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFF1" vertical={false} />
                <XAxis dataKey="month" stroke="#77727A" fontSize={11} tickLine={false} />
                <YAxis stroke="#77727A" fontSize={11} tickFormatter={(val) => `₹${val}`} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E7E5E4', fontSize: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Revenue Cleared" fill="#5E3A54" radius={[6, 6, 0, 0]} />
                <Bar dataKey="invoices" name="Amount Invoiced" fill="#259DA5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-charcoal mb-0.5">
            Subscription Status Distribution
          </h3>
          <p className="text-xs text-muted mb-4">Current subscription lifecycle breakdown</p>
          <div className="flex-1 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.subscriptionBreakdown || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={false}
                >
                  {(charts.subscriptionBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Ledger Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Recent Invoices Issued
            </h3>
            <span className="text-[11px] text-muted">Latest 5 records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full brutalist-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recent.recentInvoices || []).map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-mono font-bold text-xs text-plum">{inv.invoiceNumber}</td>
                    <td className="text-xs truncate max-w-[120px]">{inv.customer?.companyName}</td>
                    <td className="text-xs font-semibold">₹{Number(inv.totalAmount).toFixed(2)}</td>
                    <td className="text-xs font-semibold text-red-600">
                      ₹{Number(inv.balanceDue).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                  </tr>
                ))}
                {(recent.recentInvoices || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-xs text-muted">
                      No invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Recent Cleared Payments
            </h3>
            <span className="text-[11px] text-muted">Latest 5 records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full brutalist-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(recent.recentPayments || []).map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-mono font-bold text-xs text-teal-dark">{p.paymentNumber}</td>
                    <td className="text-xs truncate max-w-[120px]">{p.customer?.companyName}</td>
                    <td className="text-[11px] text-muted">{p.paymentMethod.replace('_', ' ')}</td>
                    <td className="text-xs font-bold text-emerald-700">
                      +₹{Number(p.amount).toFixed(2)}
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(recent.recentPayments || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-xs text-muted">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

