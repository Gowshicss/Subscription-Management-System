import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Customer } from '../../types';
import { Search, Plus, Building, Phone, Mail, FileText, ChevronRight, X } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    taxNumber: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get<Customer[]>(`/customers?search=${encodeURIComponent(search)}`),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (newCustomer: typeof formData) => api.post('/customers', newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateOpen(false);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        billingAddress: '',
        city: '',
        state: '',
        taxNumber: '',
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">Customer Directory</h1>
          <p className="text-xs text-muted font-medium mt-0.5">
            Central operational hub for client master data, contracts, billing profiles, and receivables
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-border p-3 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact name or email..."
            className="w-full bg-[#FAF9F7] border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-charcoal placeholder-muted focus:outline-none focus:border-plum"
          />
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Customer / Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Total Invoiced</th>
                <th>Outstanding</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted">
                    Loading customers directory...
                  </td>
                </tr>
              ) : (data || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted">
                    No customer accounts found matching your query.
                  </td>
                </tr>
              ) : (
                (data || []).map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#FAF9F7] transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FAF9F7] text-plum border border-border flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {customer.companyName.slice(0, 2)}
                        </div>
                        <span className="font-bold text-xs text-plum">{customer.companyName}</span>
                      </div>
                    </td>
                    <td className="text-xs">{customer.contactName}</td>
                    <td className="text-xs text-muted">{customer.email}</td>
                    <td className="text-xs text-muted">{customer.phone}</td>
                    <td className="text-xs font-semibold">
                      ₹{Number(customer.financialSummary?.totalInvoiced || 0).toFixed(2)}
                    </td>
                    <td className="text-xs font-bold text-red-600">
                      ₹{Number(customer.financialSummary?.totalOutstanding || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="brutalist-btn-secondary text-xs py-1 px-2.5"
                      >
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer 360 Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                  Customer 360 Profile
                </h3>
                <span className="text-xs text-plum font-bold">{selectedCustomer.companyName}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-muted hover:text-charcoal hover:bg-[#FAF9F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Primary Contact</span>
                  <span className="font-semibold text-charcoal">{selectedCustomer.contactName}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-semibold text-charcoal">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-semibold text-charcoal">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Tax Number</span>
                  <span className="font-semibold text-charcoal">{selectedCustomer.taxNumber || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted block text-[10px] uppercase font-bold">Billing Address</span>
                  <span className="font-semibold text-charcoal">
                    {selectedCustomer.billingAddress}, {selectedCustomer.city || ''} {selectedCustomer.state || ''} {selectedCustomer.country || ''}
                  </span>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="p-4 bg-[#FAF9F7] border border-border rounded-xl grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">Total Invoiced</span>
                  <span className="text-sm font-bold text-charcoal block">
                    ₹{Number(selectedCustomer.financialSummary?.totalInvoiced || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">Total Paid</span>
                  <span className="text-sm font-bold text-emerald-700 block">
                    ₹{Number(selectedCustomer.financialSummary?.totalPaid || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">Outstanding Due</span>
                  <span className="text-sm font-bold text-red-600 block">
                    ₹{Number(selectedCustomer.financialSummary?.totalOutstanding || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="brutalist-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Create New Customer
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-charcoal hover:bg-[#FAF9F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Apex Global Ltd"
                  className="brutalist-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="John Doe"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="billing@apex.io"
                  className="brutalist-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Billing Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  placeholder="120 Commerce Way"
                  className="brutalist-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="US-12345"
                    className="brutalist-input"
                  />
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
                  disabled={createCustomerMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

