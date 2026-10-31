import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { UserCheck, Plus, X, Lock, Check } from 'lucide-react';

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: staffList, isLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => api.get<any[]>('/users/staff'),
  });

  const createStaffMutation = useMutation({
    mutationFn: (body: typeof formData) => api.post('/users/staff', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      setIsCreateOpen(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '' });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create staff member.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            INTERNAL STAFF MANAGEMENT
          </h1>
          <p className="text-xs text-muted font-medium">
            (Admin Only) Provision Brightloop employee accounts for sales, operations, and invoice management
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="brutalist-card bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Account Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted">
                    Loading staff records...
                  </td>
                </tr>
              ) : (staffList || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                (staffList || []).map((staff) => (
                  <tr key={staff.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-bold text-xs text-plum">
                      {staff.firstName} {staff.lastName}
                    </td>
                    <td className="text-xs text-charcoal">{staff.email}</td>
                    <td className="text-xs">
                      <span className="brutalist-badge bg-plum text-white text-[10px]">STAFF</span>
                    </td>
                    <td className="text-xs text-muted">{staff.phone || '—'}</td>
                    <td>
                      <span
                        className={`brutalist-badge ${
                          staff.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {staff.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="text-xs text-muted font-mono">
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-md border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Provision Internal Staff Member
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Elena"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Rostova"
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Staff Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="elena@brightloop.io"
                  className="brutalist-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 012-9988"
                  className="brutalist-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Staff@2026! (>8 chars, upper, lower, special)"
                  className="brutalist-input"
                />
                <span className="text-[10px] text-muted block mt-1">
                  Must be &gt;8 chars with uppercase, lowercase, and special character.
                </span>
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
                  disabled={createStaffMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createStaffMutation.isPending ? 'Provisioning...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
