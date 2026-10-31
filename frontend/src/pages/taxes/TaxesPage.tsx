import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { TaxRule } from '../../types';
import { Calculator, Plus, X, Check } from 'lucide-react';

export const TaxesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rate: 10,
    description: '',
    isDefault: false,
  });

  const { data: taxes, isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => api.get<TaxRule[]>('/taxes?all=true'),
  });

  const createTaxMutation = useMutation({
    mutationFn: (body: typeof formData) => api.post('/taxes', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setIsCreateOpen(false);
      setFormData({ name: '', rate: 10, description: '', isDefault: false });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTaxMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            TAX RULES & JURISDICTIONS
          </h1>
          <p className="text-xs text-muted font-medium">
            Define corporate sales tax rates, VAT schedules and default rules calculated on invoices
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Tax Rule
        </button>
      </div>

      {/* Table */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Tax Rate (%)</th>
                <th>Description</th>
                <th>Default Status</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-muted">
                    Loading tax rules...
                  </td>
                </tr>
              ) : (taxes || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-muted">
                    No tax rules configured.
                  </td>
                </tr>
              ) : (
                (taxes || []).map((t) => (
                  <tr key={t.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-bold text-xs text-plum">{t.name}</td>
                    <td className="text-xs font-mono font-bold text-charcoal">
                      {Number(t.rate).toFixed(2)}%
                    </td>
                    <td className="text-xs text-muted">{t.description || '—'}</td>
                    <td>
                      {t.isDefault ? (
                        <span className="brutalist-badge bg-emerald-50 text-emerald-800 border-emerald-300">
                          Default Rule
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Standard</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`brutalist-badge ${
                          t.isActive
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-md border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Create Tax Rule
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="State Sales Tax (8.25%)"
                  className="brutalist-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Percentage Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                  className="brutalist-input font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="State & county sales levy"
                  className="brutalist-input"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-plum focus:ring-plum"
                  />
                  <span>Set as default tax rule for new invoices</span>
                </label>
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
                  disabled={createTaxMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createTaxMutation.isPending ? 'Saving...' : 'Save Tax Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
