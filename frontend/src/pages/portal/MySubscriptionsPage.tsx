import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Subscription } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Repeat, Pause, Play, RefreshCw, XCircle, Calendar } from 'lucide-react';

export const MySubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.get<Subscription[]>('/subscriptions'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/pause`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/resume`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] }),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/renew`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/close`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          MY SUBSCRIPTIONS
        </h1>
        <p className="text-xs text-muted font-medium">
          Manage your software licenses, recurring billing schedules, and self-service lifecycle actions
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-xs text-muted">Loading subscriptions...</div>
        ) : (subscriptions || []).length === 0 ? (
          <div className="brutalist-card p-8 text-center bg-white border border-border">
            <Repeat className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-charcoal">No subscriptions active</p>
            <p className="text-[11px] text-muted mt-1">
              Review and accept an approved proposal from your Quotations tab to start your subscription.
            </p>
          </div>
        ) : (
          (subscriptions || []).map((sub) => (
            <div
              key={sub.id}
              className="brutalist-card p-5 bg-white border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-plum">
                    {sub.subscriptionNumber}
                  </span>
                  <StatusBadge status={sub.status} size="sm" />
                  <span className="brutalist-badge bg-surface-secondary text-plum border border-border text-[10px]">
                    {sub.plan?.billingFrequency}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-charcoal">{sub.plan?.name}</h3>

                <div className="text-xs text-muted mt-2 space-y-0.5">
                  <p>
                    Started: {new Date(sub.startDate).toLocaleDateString()}
                    {sub.expiryDate && ` — Expires: ${new Date(sub.expiryDate).toLocaleDateString()}`}
                  </p>
                  <p className="font-semibold text-charcoal flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-accent" />
                    Next billing date:{' '}
                    <span className="font-mono text-plum">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs text-muted block">Recurring Cycle Amount</span>
                  <span className="text-xl font-bold text-charcoal">
                    ₹{Number(sub.totalAmount).toFixed(2)}
                  </span>
                </div>

                {/* Self-service Actions */}
                <div className="flex items-center gap-2">
                  {sub.status === 'ACTIVE' && sub.plan?.allowPause && (
                    <button
                      onClick={() => pauseMutation.mutate(sub.id)}
                      disabled={pauseMutation.isPending}
                      className="brutalist-btn-secondary text-xs py-1.5 px-3 text-amber-700"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-600" /> Pause Subscription
                    </button>
                  )}

                  {sub.status === 'PAUSED' && (
                    <button
                      onClick={() => resumeMutation.mutate(sub.id)}
                      disabled={resumeMutation.isPending}
                      className="brutalist-btn-primary text-xs py-1.5 px-3"
                    >
                      <Play className="w-3.5 h-3.5 text-teal-accent" /> Resume
                    </button>
                  )}

                  {sub.status === 'ACTIVE' && sub.plan?.allowRenewal && (
                    <button
                      onClick={() => renewMutation.mutate(sub.id)}
                      disabled={renewMutation.isPending}
                      className="brutalist-btn-secondary text-xs py-1.5 px-3 text-teal-dark"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal-accent" /> Renew Plan
                    </button>
                  )}

                  {sub.status === 'ACTIVE' && sub.plan?.allowEarlyClosure && (
                    <button
                      onClick={() => closeMutation.mutate(sub.id)}
                      disabled={closeMutation.isPending}
                      className="brutalist-btn-danger text-xs py-1.5 px-3"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Early
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

