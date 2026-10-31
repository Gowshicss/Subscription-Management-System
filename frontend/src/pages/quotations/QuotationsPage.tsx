import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Quotation, Customer, Product, SubscriptionPlan } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Send, FileText, X, Check, Eye } from 'lucide-react';

export const QuotationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    { productId: string; variantId: string; quantity: number; unitPrice?: number }[]
  >([{ productId: '', variantId: '', quantity: 1 }]);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => api.get<Quotation[]>('/quotations'),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get<Customer[]>('/customers'),
  });

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get<Product[]>('/products'),
  });

  const { data: plans } = useQuery({
    queryKey: ['plans-list'],
    queryFn: () => api.get<SubscriptionPlan[]>('/plans'),
  });

  const createQuotationMutation = useMutation({
    mutationFn: (body: any) => api.post('/quotations', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const sendQuotationMutation = useMutation({
    mutationFn: (id: string) => api.post(`/quotations/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const resetForm = () => {
    setCustomerId('');
    setPlanId('');
    setValidityDays(30);
    setNotes('');
    setItems([{ productId: '', variantId: '', quantity: 1 }]);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', variantId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'productId') {
      updated[index].variantId = '';
    }
    setItems(updated);
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    createQuotationMutation.mutate({
      customerId,
      planId: planId || undefined,
      validityDays,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        quantity: i.quantity,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            QUOTATIONS & PROPOSALS
          </h1>
          <p className="text-xs text-muted font-medium">
            Draft customized commercial offers with dynamic variant pricing, discounts, and dispatch for customer approval
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </div>

      {/* Table */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Valid Until</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted">
                    Loading quotations...
                  </td>
                </tr>
              ) : (quotations || []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                (quotations || []).map((q) => (
                  <tr key={q.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">{q.quotationNumber}</td>
                    <td className="text-xs font-semibold text-charcoal">{q.customer?.companyName}</td>
                    <td className="text-xs text-muted">
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>
                    <td className="text-xs font-semibold">${Number(q.subtotal).toFixed(2)}</td>
                    <td className="text-xs font-semibold text-emerald-700">
                      -${Number(q.discountAmount).toFixed(2)}
                    </td>
                    <td className="text-xs text-muted">${Number(q.taxAmount).toFixed(2)}</td>
                    <td className="text-xs font-bold text-charcoal">
                      ${Number(q.totalAmount).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={q.status} size="sm" />
                    </td>
                    <td className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQuotation(q)}
                        className="brutalist-btn-secondary text-xs py-1 px-2"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {q.status === 'DRAFT' && (
                        <button
                          onClick={() => sendQuotationMutation.mutate(q.id)}
                          disabled={sendQuotationMutation.isPending}
                          className="brutalist-btn-primary text-xs py-1 px-2"
                          title="Send to Customer"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
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

      {/* Create Quotation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="brutalist-card bg-white w-full max-w-2xl border border-border my-8">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Create Commercial Quotation
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Customer *
                  </label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="brutalist-input"
                  >
                    <option value="">-- Select Customer --</option>
                    {(customers || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.contactName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Subscription Plan (Optional default)
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="brutalist-input"
                  >
                    <option value="">-- Select Plan --</option>
                    {(plans || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${Number(p.basePrice).toFixed(2)} / {p.billingFrequency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-plum">
                    Quotation Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-teal-accent hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Line
                  </button>
                </div>

                {items.map((item, idx) => {
                  const selectedProduct = (products || []).find((p) => p.id === item.productId);
                  const availableVariants = selectedProduct?.variants || [];

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-surface-secondary border border-border rounded grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-5">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="brutalist-input text-xs"
                        >
                          <option value="">-- Select Product --</option>
                          {(products || []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${Number(p.salesPrice).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <select
                          value={item.variantId}
                          onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                          className="brutalist-input text-xs"
                          disabled={availableVariants.length === 0}
                        >
                          <option value="">Standard ($0)</option>
                          {availableVariants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} (+${Number(v.additionalPrice).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                          }
                          className="brutalist-input text-xs"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 font-bold p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, special discounts, or contract details..."
                  rows={2}
                  className="brutalist-input"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="brutalist-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQuotationMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createQuotationMutation.isPending ? 'Generating...' : 'Save Draft Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-plum">{selectedQuotation.quotationNumber}</h3>
                <span className="text-xs text-muted">
                  Customer: {selectedQuotation.customer?.companyName}
                </span>
              </div>
              <StatusBadge status={selectedQuotation.status} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Line Items
              </span>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-surface-secondary border-b border-border">
                    <tr>
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedQuotation.items || []).map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="p-2">
                          <span className="font-semibold">{item.product?.name}</span>
                          {item.variant && (
                            <span className="text-[10px] text-teal-dark block">
                              {item.variant.name}
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

            {/* Financial Summary */}
            <div className="p-3 bg-surface-secondary border border-border rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span className="font-semibold">${Number(selectedQuotation.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied:</span>
                <span className="font-semibold">
                  -${Number(selectedQuotation.discountAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax Amount:</span>
                <span className="font-semibold">${Number(selectedQuotation.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-plum border-t border-border pt-1">
                <span>Total Amount:</span>
                <span>${Number(selectedQuotation.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="brutalist-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
