import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SubscriptionPlan, BillingFrequency } from '../../types';
import { Plus, Calendar, Check, X, Shield, Clock } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 100,
    billingFrequency: 'MONTHLY' as BillingFrequency,
    minQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoClose: false,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<SubscriptionPlan[]>('/plans?activeOnly=false'),
  });

  const createPlanMutation = useMutation({
    mutationFn: (newPlan: typeof formData) =>
      api.post('/plans', {
        ...newPlan,
        endDate: newPlan.endDate ? newPlan.endDate : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsCreateOpen(false);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            SUBSCRIPTION PLANS
          </h1>
          <p className="text-xs text-muted font-medium">
            Configure recurring billing cadences, pricing tiers, auto-closure rules and customer self-service permissions
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-10 text-xs text-muted">Loading plans...</div>
        ) : (
          (plans || []).map((plan) => (
            <div
              key={plan.id}
              className={`brutalist-card p-5 bg-white border flex flex-col justify-between ${
                plan.isActive ? 'border-border' : 'border-dashed border-gray-300 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal">{plan.name}</h3>
                    <span className="brutalist-badge bg-surface-secondary text-plum border border-border mt-1">
                      {plan.billingFrequency}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-plum block">
                      ₹{Number(plan.basePrice).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted">
                      / {plan.billingFrequency.toLowerCase().replace('ly', '')}
                    </span>
                  </div>
                </div>

                {plan.description && (
                  <p className="mt-2.5 text-xs text-muted">{plan.description}</p>
                )}

                {/* Plan Permissions and Lifecycle Badges */}
                <div className="mt-4 pt-3 border-t border-border space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                    Plan Rules & Permissions:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {plan.allowPause ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className={plan.allowPause ? 'text-charcoal' : 'text-muted'}>
                        Allow Pause
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.allowRenewal ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className={plan.allowRenewal ? 'text-charcoal' : 'text-muted'}>
                        Allow Renewal
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.allowEarlyClosure ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className={plan.allowEarlyClosure ? 'text-charcoal' : 'text-muted'}>
                        Early Closure
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.autoClose ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-muted" />
                      )}
                      <span className={plan.autoClose ? 'text-charcoal' : 'text-muted'}>
                        Auto Close
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted">
                  Min Qty: <strong>{plan.minQuantity}</strong>
                </span>
                <button
                  onClick={() => toggleActiveMutation.mutate(plan.id)}
                  className={`px-2.5 py-1 rounded font-semibold border ${
                    plan.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Plan Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-lg border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Create Subscription Plan
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded text-muted hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enterprise Dedicated Plan"
                  className="brutalist-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Base Recurring Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Billing Frequency *
                  </label>
                  <select
                    value={formData.billingFrequency}
                    onChange={(e) =>
                      setFormData({ ...formData, billingFrequency: e.target.value as BillingFrequency })
                    }
                    className="brutalist-input"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
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

              {/* Policy Checkboxes */}
              <div className="pt-2 border-t border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-plum block">
                  Permissions & Rules:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowPause}
                      onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                      className="rounded text-plum focus:ring-plum"
                    />
                    <span>Allow Pause</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowRenewal}
                      onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                      className="rounded text-plum focus:ring-plum"
                    />
                    <span>Allow Renewal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowEarlyClosure}
                      onChange={(e) =>
                        setFormData({ ...formData, allowEarlyClosure: e.target.checked })
                      }
                      className="rounded text-plum focus:ring-plum"
                    />
                    <span>Allow Early Closure</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoClose}
                      onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                      className="rounded text-plum focus:ring-plum"
                    />
                    <span>Auto-Close on End</span>
                  </label>
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
                  disabled={createPlanMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createPlanMutation.isPending ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

