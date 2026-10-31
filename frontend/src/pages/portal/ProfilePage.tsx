import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Customer } from '../../types';
import { User, Building, Mail, Phone, MapPin, Save, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['my-customer-profile', user?.customerId],
    queryFn: () => (user?.customerId ? api.get<Customer>(`/customers/${user.customerId}`) : null),
    enabled: !!user?.customerId,
  });

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    postalCode: '',
    taxNumber: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName || '',
        contactName: customer.contactName || '',
        phone: customer.phone || '',
        billingAddress: customer.billingAddress || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || '',
        taxNumber: customer.taxNumber || '',
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (body: typeof formData) => api.put(`/customers/${user?.customerId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-customer-profile'] });
      setToast(true);
      setTimeout(() => setToast(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          COMPANY PROFILE & BILLING INFORMATION
        </h1>
        <p className="text-xs text-muted font-medium">
          Update registered commercial details, tax identifier, and official billing address for invoices
        </p>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Profile updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="brutalist-card p-6 bg-white border border-border space-y-4">
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
              Contact Representative *
            </label>
            <input
              type="text"
              required
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="brutalist-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              Primary Email (Account ID)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="brutalist-input bg-gray-100 cursor-not-allowed text-muted"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              Business Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="brutalist-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              Billing Address *
            </label>
            <input
              type="text"
              required
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              className="brutalist-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="brutalist-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              State / Province
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="brutalist-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              Postal / Zip Code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="brutalist-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
              Tax ID / VAT Number
            </label>
            <input
              type="text"
              value={formData.taxNumber}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              className="brutalist-input"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="brutalist-btn-primary"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
