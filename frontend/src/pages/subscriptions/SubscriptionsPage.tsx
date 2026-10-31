import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Subscription, SubscriptionStatus } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Repeat, Play, Pause, RefreshCw, XCircle, CheckCircle, Eye, Calendar } from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () =>
      api.get<Subscription[]>(
        `/subscriptions${statusFilter ? `?status=${statusFilter}` : ''}`
      ),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/pause`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/resume`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/renew`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/close`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            Subscriptions Management
          </h1>
          <p className="text-xs text-muted font-medium mt-0.5">
            Track active customer contracts, automated recurring billing schedules, and manage lifecycle state transitions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-white p-1.5 border border-border rounded-2xl shadow-xs text-xs">
          {['', 'ACTIVE', 'PAUSED', 'CONFIRMED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-colors ${
                statusFilter === st
                  ? 'bg-plum text-white shadow-xs'
                  : 'text-muted hover:text-charcoal hover:bg-[#FAF9F7]'
              }`}
            >
              {st || 'All Subscriptions'}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full brutalist-table">
            <thead>
              <tr>
                <th>Subscription #</th>
                <th>Customer</th>
                <th>Plan Name</th>
                <th>Next Billing Date</th>
                <th>Cycle Amount</th>
                <th>Status</th>
                <th>Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted">
                    Loading subscription ledger...
                  </td>
                </tr>
              ) : (subscriptions || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted">
                    No subscriptions found for the selected status.
                  </td>
                </tr>
              ) : (
                (subscriptions || []).map((sub) => (
                  <tr key={sub.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="font-mono font-bold text-xs text-plum">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="text-xs font-semibold text-charcoal">{sub.customer?.companyName}</td>
                    <td className="text-xs">
                      <span className="font-medium text-charcoal">{sub.plan?.name}</span>
                      <span className="text-[10px] text-muted block uppercase">
                        {sub.plan?.billingFrequency}
                      </span>
                    </td>
                    <td className="text-xs font-mono">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="text-xs font-bold text-charcoal">
                      ₹{Number(sub.totalAmount).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={sub.status} size="sm" />
                    </td>
                    <td className="flex items-center gap-1.5">
                      {/* Confirm/Activate if Draft or Confirmed */}
                      {sub.status === 'CONFIRMED' && (
                        <button
                          onClick={() => activateMutation.mutate(sub.id)}
                          className="brutalist-btn-primary text-xs py-1 px-2"
                          title="Activate Subscription"
                        >
                          <Play className="w-3 h-3 text-emerald-400" /> Activate
                        </button>
                      )}

                      {/* Pause / Resume */}
                      {sub.status === 'ACTIVE' && sub.plan?.allowPause && (
                        <button
                          onClick={() => pauseMutation.mutate(sub.id)}
                          className="brutalist-btn-secondary text-xs py-1 px-2 text-amber-700"
                          title="Pause recurring billing"
                        >
                          <Pause className="w-3 h-3 text-amber-600" /> Pause
                        </button>
                      )}

                      {sub.status === 'PAUSED' && (
                        <button
                          onClick={() => resumeMutation.mutate(sub.id)}
                          className="brutalist-btn-primary text-xs py-1 px-2"
                          title="Resume active billing"
                        >
                          <Play className="w-3 h-3 text-teal-accent" /> Resume
                        </button>
                      )}

                      {/* Renew */}
                      {sub.status === 'ACTIVE' && sub.plan?.allowRenewal && (
                        <button
                          onClick={() => renewMutation.mutate(sub.id)}
                          className="brutalist-btn-secondary text-xs py-1 px-2 text-teal-dark"
                          title="Renew contract"
                        >
                          <RefreshCw className="w-3 h-3 text-teal-accent" /> Renew
                        </button>
                      )}

                      {/* Close */}
                      {sub.status === 'ACTIVE' && (
                        <button
                          onClick={() => closeMutation.mutate(sub.id)}
                          className="brutalist-btn-danger text-xs py-1 px-2"
                          title="Close subscription"
                        >
                          <XCircle className="w-3 h-3" /> Close
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
    </div>
  );
};

