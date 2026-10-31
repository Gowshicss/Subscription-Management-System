import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Invoice, InvoiceStatus, PaymentMethod } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Receipt, Download, CreditCard, Check, X, AlertTriangle, Eye } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () =>
      api.get<Invoice[]>(`/invoices${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (body: any) => api.post('/payments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setPaymentModalInvoice(null);
      setPaymentAmount(0);
      setPaymentNote('');
      setPaymentError(null);
    },
    onError: (err: any) => {
      setPaymentError(err.message || 'Payment recording failed.');
    },
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

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentAmount(Number(invoice.balanceDue));
    setPaymentError(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    setPaymentError(null);

    recordPaymentMutation.mutate({
      invoiceId: paymentModalInvoice.id,
      amount: paymentAmount,
      paymentMethod,
      referenceNote: paymentNote,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            INVOICES & FINANCIAL LEDGER
          </h1>
          <p className="text-xs text-muted font-medium">
            Generated billing cycles, payment allocations, outstanding balances, and official PDF statements
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 border border-border rounded text-xs">
          {['', 'CONFIRMED', 'PAID', 'DRAFT', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-plum text-white'
                  : 'text-muted hover:text-charcoal hover:bg-surface-secondary'
              }`}
            >
              {st || 'All Invoices'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Period</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted">
                    Loading invoices...
                  </td>
                </tr>
              ) : (invoices || []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                (invoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">{inv.invoiceNumber}</td>
                    <td className="text-xs font-semibold text-charcoal">{inv.customer?.companyName}</td>
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
                      ${Number(inv.totalAmount).toFixed(2)}
                    </td>
                    <td className="text-xs font-semibold text-emerald-700">
                      ${Number(inv.amountPaid).toFixed(2)}
                    </td>
                    <td className="text-xs font-bold text-red-600">
                      ${Number(inv.balanceDue).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="flex items-center gap-1.5">
                      {/* PDF download */}
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        className="brutalist-btn-secondary text-xs py-1 px-2"
                        title="Download PDF Invoice"
                      >
                        <Download className="w-3.5 h-3.5 text-teal-dark" />
                      </button>

                      {/* Confirm Draft */}
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => confirmMutation.mutate(inv.id)}
                          className="brutalist-btn-primary text-xs py-1 px-2"
                          title="Confirm Invoice"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm
                        </button>
                      )}

                      {/* Record Payment */}
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && Number(inv.balanceDue) > 0 && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="brutalist-btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-xs py-1 px-2"
                          title="Record Customer Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-md border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                  Record Customer Payment
                </h3>
                <span className="text-xs text-plum font-semibold">
                  Invoice: {paymentModalInvoice.invoiceNumber}
                </span>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="p-1 rounded text-muted hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {paymentError}
                </div>
              )}

              {/* Balance Summary Header */}
              <div className="p-3 bg-surface-secondary border border-border rounded flex justify-between text-xs">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">
                    Invoice Total:
                  </span>
                  <span className="font-bold text-charcoal">
                    ${Number(paymentModalInvoice.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">
                    Already Paid:
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${Number(paymentModalInvoice.amountPaid).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted block text-[10px] uppercase font-bold">
                    Outstanding Balance:
                  </span>
                  <span className="font-bold text-red-600 text-sm">
                    ${Number(paymentModalInvoice.balanceDue).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(paymentModalInvoice.balanceDue)}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="brutalist-input font-bold"
                />
                <span className="text-[10px] text-muted block mt-1">
                  Enter partial amount or settle the entire balance ($
                  {Number(paymentModalInvoice.balanceDue).toFixed(2)})
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="brutalist-input"
                >
                  <option value="BANK_TRANSFER">BANK TRANSFER / WIRE</option>
                  <option value="CREDIT_CARD">CREDIT CARD</option>
                  <option value="ONLINE">ONLINE PAYMENT PORTAL</option>
                  <option value="CHECK">CHECK</option>
                  <option value="CASH">CASH</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Reference Note / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Wire #WT-94819 / Cheque #1042"
                  className="brutalist-input"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="brutalist-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending || paymentAmount <= 0}
                  className="brutalist-btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                >
                  {recordPaymentMutation.isPending ? 'Processing...' : 'Post Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
