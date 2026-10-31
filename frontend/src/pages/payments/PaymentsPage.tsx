import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Payment } from '../../types';
import { CreditCard, Search, ArrowUpRight } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get<Payment[]>('/payments'),
  });

  const filtered = (payments || []).filter(
    (p) =>
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.referenceNote?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          PAYMENTS & SETTLEMENT HISTORY
        </h1>
        <p className="text-xs text-muted font-medium">
          Auditable transaction ledger of all cleared payments, partial installments, and bank allocations
        </p>
      </div>

      {/* Filter and Search */}
      <div className="brutalist-card p-3 bg-white flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment #, invoice #, customer or reference..."
            className="brutalist-input pl-9"
          />
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Reference / Transaction Note</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-muted">
                    Loading payments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-muted">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">{p.paymentNumber}</td>
                    <td className="font-mono text-xs font-semibold text-charcoal">
                      {p.invoice?.invoiceNumber}
                    </td>
                    <td className="text-xs font-medium">{p.customer?.companyName}</td>
                    <td className="text-xs">
                      <span className="brutalist-badge bg-surface-secondary text-charcoal border border-border text-[10px]">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-xs font-bold text-emerald-700">
                      +₹{Number(p.amount).toFixed(2)}
                    </td>
                    <td className="text-xs text-muted font-mono">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="text-xs text-muted truncate max-w-[200px]">
                      {p.referenceNote || '—'}
                    </td>
                    <td className="text-xs text-muted">
                      {p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

