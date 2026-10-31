import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { BusinessSettings } from '../../types';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [savedToast, setSavedToast] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => api.get<BusinessSettings>('/settings'),
  });

  const [formData, setFormData] = useState({
    companyName: '',
    currency: 'USD',
    currencySymbol: '$',
    taxNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    invoicePrefix: 'INV',
    quotationPrefix: 'QT',
    subPrefix: 'SUB',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || '',
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$',
        taxNumber: settings.taxNumber || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
        invoicePrefix: settings.invoicePrefix || 'INV',
        quotationPrefix: settings.quotationPrefix || 'QT',
        subPrefix: settings.subPrefix || 'SUB',
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (body: typeof formData) => api.put('/settings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-xs text-muted p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          ENTERPRISE BUSINESS SETTINGS
        </h1>
        <p className="text-xs text-muted font-medium">
          Manage corporate identity, configurable operational currency, legal address, and invoice numbering prefixes
        </p>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings successfully updated.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity */}
        <div className="brutalist-card p-6 bg-white border border-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-plum border-b border-border pb-2">
            Company Identity & Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="brutalist-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Corporate Tax / VAT ID
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="brutalist-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Billing Email *
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="brutalist-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Support Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="brutalist-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Official Business Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="brutalist-input"
              />
            </div>
          </div>
        </div>

        {/* Currency & Document Prefixes */}
        <div className="brutalist-card p-6 bg-white border border-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-plum border-b border-border pb-2">
            Currency & Document Numbering
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Operational Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const val = e.target.value;
                  const sym = val === 'EUR' ? '€' : val === 'GBP' ? '£' : val === 'INR' ? '₹' : '$';
                  setFormData({ ...formData, currency: val, currencySymbol: sym });
                }}
                className="brutalist-input"
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="CAD">CAD — Canadian Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Currency Symbol *
              </label>
              <input
                type="text"
                required
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="brutalist-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                placeholder="INV"
                className="brutalist-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Quotation Number Prefix
              </label>
              <input
                type="text"
                value={formData.quotationPrefix}
                onChange={(e) => setFormData({ ...formData, quotationPrefix: e.target.value })}
                placeholder="QT"
                className="brutalist-input font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="brutalist-btn-primary"
          >
            <Save className="w-4 h-4" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
