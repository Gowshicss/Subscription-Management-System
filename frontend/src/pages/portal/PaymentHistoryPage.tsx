import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Payment } from '../../types';
import { CreditCard, CheckCircle } from 'lucide-react';

export const PaymentHistoryPage: React.FC = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => api.get<Payment[]>('/payments'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          PAYMENT HISTORY
        </h1>
        <p className="text-xs text-muted font-medium">
          Historical record of all settled amounts, wire transfers, and online transactions
        </p>
      </div>

      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Invoice #</th>
                <th>Payment Method</th>
                <th>Amount Paid</th>
                <th>Date Settled</th>
                <th>Transaction Note</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted">
                    Loading payments...
                  </td>
                </tr>
              ) : (payments || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted">
                    No payment transactions recorded.
                  </td>
                </tr>
              ) : (
                (payments || []).map((p) => (
                  <tr key={p.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">{p.paymentNumber}</td>
                    <td className="font-mono text-xs font-semibold text-charcoal">
                      {p.invoice?.invoiceNumber}
                    </td>
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
                    <td className="text-xs text-muted">{p.referenceNote || '—'}</td>
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

