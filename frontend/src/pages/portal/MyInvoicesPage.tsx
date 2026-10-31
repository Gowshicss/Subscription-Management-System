import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Invoice } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Receipt, Download, AlertCircle, FileText } from 'lucide-react';

export const MyInvoicesPage: React.FC = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => api.get<Invoice[]>('/invoices'),
  });

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/v1/invoices/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Failed to generate PDF invoice.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          MY INVOICES & STATEMENTS
        </h1>
        <p className="text-xs text-muted font-medium">
          Official billing statements, payment balances, and downloadable tax receipts
        </p>
      </div>

      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Billing Period</th>
                <th>Due Date</th>
                <th>Invoice Total</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Statement</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-muted">
                    Loading invoices...
                  </td>
                </tr>
              ) : (invoices || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-muted">
                    No invoices on record.
                  </td>
                </tr>
              ) : (
                (invoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">{inv.invoiceNumber}</td>
                    <td className="text-xs text-muted font-mono">
                      {new Date(inv.periodStart).toLocaleDateString()} –{' '}
                      {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="text-xs">
                      <span className={inv.isOverdue ? 'text-red-600 font-bold' : 'text-muted'}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                      {inv.isOverdue && (
                        <span className="brutalist-badge bg-red-100 text-red-800 ml-1.5 text-[9px]">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="text-xs font-bold text-charcoal">
                      ₹{Number(inv.totalAmount).toFixed(2)}
                    </td>
                    <td className="text-xs font-semibold text-emerald-700">
                      ₹{Number(inv.amountPaid).toFixed(2)}
                    </td>
                    <td className="text-xs font-bold text-red-600">
                      ₹{Number(inv.balanceDue).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td>
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        className="brutalist-btn-secondary text-xs py-1 px-2.5"
                        title="Download official PDF invoice"
                      >
                        <Download className="w-3.5 h-3.5 text-teal-dark" /> PDF
                      </button>
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

