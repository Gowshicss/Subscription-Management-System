import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Discount, DiscountType, Product } from '../../types';
import { Percent, Plus, X, Calendar, Check, AlertCircle } from 'lucide-react';

export const DiscountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE' as DiscountType,
    value: 10,
    minPurchaseAmount: '',
    minQuantity: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    usageLimit: '',
    productId: '',
    applyToWholeSub: true,
  });

  const { data: discounts, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => api.get<Discount[]>('/discounts?all=true'),
  });

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get<Product[]>('/products'),
  });

  const createDiscountMutation = useMutation({
    mutationFn: (body: any) => api.post('/discounts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setIsCreateOpen(false);
      setFormData({
        code: '',
        name: '',
        type: 'PERCENTAGE',
        value: 10,
        minPurchaseAmount: '',
        minQuantity: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        usageLimit: '',
        productId: '',
        applyToWholeSub: true,
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDiscountMutation.mutate({
      ...formData,
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
      minQuantity: formData.minQuantity ? parseInt(formData.minQuantity, 10) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
      productId: formData.productId ? formData.productId : null,
      endDate: formData.endDate ? formData.endDate : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            DISCOUNT & COUPON RULES
          </h1>
          <p className="text-xs text-muted font-medium">
            Admin-only rule builder for volume tiers, welcome vouchers, and automatic invoice credits
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Discount Rule
        </button>
      </div>

      {/* Discounts Table */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Rule Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Eligibility Triggers</th>
                <th>Scope</th>
                <th>Usage / Limit</th>
                <th>Validity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted">
                    Loading discount rules...
                  </td>
                </tr>
              ) : (discounts || []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted">
                    No discount rules created yet.
                  </td>
                </tr>
              ) : (
                (discounts || []).map((d) => (
                  <tr key={d.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">{d.code}</td>
                    <td className="text-xs font-semibold text-charcoal">{d.name}</td>
                    <td className="text-xs font-mono">{d.type}</td>
                    <td className="text-xs font-bold text-emerald-700">
                      {d.type === 'PERCENTAGE'
                        ? `${Number(d.value)}%`
                        : `₹${Number(d.value).toFixed(2)}`}
                    </td>
                    <td className="text-xs text-muted">
                      {d.minPurchaseAmount && (
                        <span className="block">Min: ₹{Number(d.minPurchaseAmount).toFixed(2)}</span>
                      )}
                      {d.minQuantity && <span className="block">Min Qty: {d.minQuantity}</span>}
                      {!d.minPurchaseAmount && !d.minQuantity && <span>None</span>}
                    </td>
                    <td className="text-xs">
                      {d.applyToWholeSub ? (
                        <span className="brutalist-badge bg-blue-50 text-blue-800">
                          Whole Subscription
                        </span>
                      ) : (
                        <span className="brutalist-badge bg-teal-soft text-teal-dark">
                          {d.product?.name || 'Specific Product'}
                        </span>
                      )}
                    </td>
                    <td className="text-xs font-mono">
                      {d.timesUsed} / {d.usageLimit !== null ? d.usageLimit : '∞'}
                    </td>
                    <td className="text-xs text-muted font-mono">
                      {new Date(d.startDate).toLocaleDateString()}
                      {d.endDate && ` – ${new Date(d.endDate).toLocaleDateString()}`}
                    </td>
                    <td>
                      <span
                        className={`brutalist-badge ${
                          d.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-lg border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Create Discount Rule
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SPRING20"
                    className="brutalist-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Spring Enterprise 20% Off"
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
                    className="brutalist-input"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED AMOUNT (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="brutalist-input font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Min Purchase (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                    placeholder="e.g. 200.00"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Min Quantity (Seats)
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    placeholder="e.g. 5"
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="e.g. 100"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Applies To
                  </label>
                  <select
                    value={formData.applyToWholeSub ? 'WHOLE' : formData.productId}
                    onChange={(e) => {
                      if (e.target.value === 'WHOLE') {
                        setFormData({ ...formData, applyToWholeSub: true, productId: '' });
                      } else {
                        setFormData({ ...formData, applyToWholeSub: false, productId: e.target.value });
                      }
                    }}
                    className="brutalist-input"
                  >
                    <option value="WHOLE">Whole Subscription</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        Product: {p.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={createDiscountMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createDiscountMutation.isPending ? 'Saving...' : 'Save Discount Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

