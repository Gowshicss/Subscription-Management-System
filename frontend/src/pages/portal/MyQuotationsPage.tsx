import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Quotation } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CheckCircle2, FileText, AlertCircle, Eye, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyQuotationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ['my-quotations'],
    queryFn: () => api.get<Quotation[]>('/quotations'),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/quotations/${id}/accept`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-portal-summary'] });
      setAcceptMessage(
        `Quotation accepted! Subscription ${data.subscriptionNumber} has been activated.`
      );
      setTimeout(() => {
        navigate('/portal/subscriptions');
      }, 2500);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          MY PROPOSALS & QUOTATIONS
        </h1>
        <p className="text-xs text-muted font-medium">
          Review commercial offers submitted by the Brightloop team and accept to activate your subscriptions
        </p>
      </div>

      {acceptMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{acceptMessage} Redirecting to your subscriptions...</span>
        </div>
      )}

      {/* Quotations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-xs text-muted">Loading quotations...</div>
        ) : (quotations || []).length === 0 ? (
          <div className="brutalist-card p-8 text-center bg-white border border-border">
            <FileText className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-charcoal">No quotations available</p>
            <p className="text-[11px] text-muted mt-1">
              Contact our sales representatives at sales@brightloop.io to request a custom quote.
            </p>
          </div>
        ) : (
          (quotations || []).map((quote) => (
            <div
              key={quote.id}
              className="brutalist-card p-5 bg-white border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-plum">
                    {quote.quotationNumber}
                  </span>
                  <StatusBadge status={quote.status} size="sm" />
                </div>

                <div className="text-xs text-muted space-y-0.5">
                  <p>
                    Valid until:{' '}
                    <strong className="text-charcoal">
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </strong>
                  </p>
                  <p>
                    {quote.items?.length || 0} product item(s) included
                  </p>
                </div>

                {quote.notes && (
                  <p className="text-xs text-muted italic mt-1 max-w-lg">{quote.notes}</p>
                )}
              </div>

              <div className="flex flex-col sm:items-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs text-muted block">Contract Value</span>
                  <span className="text-xl font-bold text-charcoal">
                    ${Number(quote.totalAmount).toFixed(2)}
                  </span>
                  {Number(quote.discountAmount) > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-700 block">
                      Includes ${Number(quote.discountAmount).toFixed(2)} discount
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedQuote(quote)}
                    className="brutalist-btn-secondary text-xs py-1.5 px-3"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Proposal
                  </button>

                  {quote.status === 'SENT' && (
                    <button
                      onClick={() => acceptMutation.mutate(quote.id)}
                      disabled={acceptMutation.isPending}
                      className="brutalist-btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-xs py-1.5 px-3"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {acceptMutation.isPending ? 'Activating...' : 'Accept & Activate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Proposal Breakdown Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-lg border border-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-plum">{selectedQuote.quotationNumber}</h3>
                <span className="text-xs text-muted">
                  Offer valid until {new Date(selectedQuote.validUntil).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="p-1 rounded text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Included Offerings
              </span>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-surface-secondary border-b border-border">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedQuote.items || []).map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="p-2">
                          <span className="font-semibold">{item.product?.name}</span>
                          {item.variant && (
                            <span className="text-[10px] text-teal-dark block">
                              Variant: {item.variant.name}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">
                          ${Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Details */}
            <div className="p-3 bg-surface-secondary border border-border rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span className="font-semibold">${Number(selectedQuote.subtotal).toFixed(2)}</span>
              </div>
              {Number(selectedQuote.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-semibold">
                    -${Number(selectedQuote.discountAmount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Tax:</span>
                <span className="font-semibold">${Number(selectedQuote.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-plum border-t border-border pt-1">
                <span>Total Amount:</span>
                <span>${Number(selectedQuote.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedQuote(null)} className="brutalist-btn-secondary">
                Close
              </button>
              {selectedQuote.status === 'SENT' && (
                <button
                  onClick={() => {
                    acceptMutation.mutate(selectedQuote.id);
                    setSelectedQuote(null);
                  }}
                  className="brutalist-btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                >
                  Accept & Activate Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
