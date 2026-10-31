import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Product, SubscriptionPlan } from '../../types';
import {
  Package,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const ExploreProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch catalog products
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['explore-products'],
    queryFn: () => api.get<Product[]>('/products'),
  });

  // Fetch subscription plans
  const { data: plans = [], isLoading: loadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['explore-plans'],
    queryFn: () => api.get<SubscriptionPlan[]>('/plans'),
  });

  // Self-subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (payload: any) => api.post('/portal/subscribe', payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-portal-summary'] });
      setSelectedProduct(null);
      setSuccessMessage(
        `Subscription ${data.data?.subscriptionNumber || ''} activated successfully! Redirecting to your subscriptions...`
      );
      setTimeout(() => {
        navigate('/portal/subscriptions');
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to activate subscription. Please try again.');
    },
  });

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariantId('');
    setQuantity(1);
    setErrorMessage(null);
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPlanId) return;

    subscribeMutation.mutate({
      planId: selectedPlanId,
      items: [
        {
          productId: selectedProduct.id,
          variantId: selectedVariantId || undefined,
          quantity,
        },
      ],
      paymentTerms: 'Due on Receipt',
    });
  };

  // Calculate pricing breakdown in modal
  const activePlan = plans.find((p) => p.id === selectedPlanId);
  const activeVariant = selectedProduct?.variants?.find((v) => v.id === selectedVariantId);
  const unitSalesPrice = selectedProduct ? Number(selectedProduct.salesPrice) : 0;
  const variantAdditional = activeVariant ? Number(activeVariant.additionalPrice) : 0;
  const lineItemUnit = unitSalesPrice + variantAdditional;
  const subtotal = lineItemUnit * quantity;
  const estimatedTax = subtotal * 0.1; // 10% standard tax
  const totalAmount = subtotal + estimatedTax;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            EXPLORE APPLICATIONS & PLANS
          </h1>
          <p className="text-xs text-muted font-medium">
            Browse Brightloop's business software catalog, enterprise connectors, and add new subscriptions
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Info Callout */}
      <div className="brutalist-card bg-surface-secondary border border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-teal-accent/20 flex items-center justify-center text-teal-dark">
            <Sparkles className="w-4 h-4 text-teal-dark" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal block">Instant Self-Service Subscription</span>
            <span className="text-[11px] text-muted block">
              Choose any software suite or add-on below, select your billing frequency, and activate immediately.
            </span>
          </div>
        </div>
      </div>

      {/* Products & Applications Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-plum flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-accent" /> Available Applications & Modules
          </h2>
          <span className="text-[11px] text-muted">
            {products.length} {products.length === 1 ? 'application' : 'applications'} available
          </span>
        </div>

        {loadingProducts ? (
          <div className="p-8 text-center text-xs text-muted">Loading available catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="brutalist-card bg-white p-5 border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-teal-dark font-bold block uppercase tracking-wider">
                        {product.code}
                      </span>
                      <h3 className="text-sm font-bold text-charcoal mt-0.5">{product.name}</h3>
                    </div>
                    <span className="brutalist-badge bg-surface-secondary text-charcoal border border-border text-[9px]">
                      {product.type}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-xl font-bold text-plum block">
                      ₹{Number(product.salesPrice).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted">Base recurring license price</span>
                  </div>

                  {product.notes && (
                    <p className="mt-2.5 text-xs text-muted line-clamp-2">{product.notes}</p>
                  )}

                  {/* Variants Preview */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-teal-accent" /> Available Add-ons & Editions:
                      </span>
                      <div className="space-y-1">
                        {product.variants.map((v) => (
                          <div
                            key={v.id}
                            className="text-[11px] flex items-center justify-between bg-surface-secondary p-1.5 rounded"
                          >
                            <span className="font-medium text-charcoal truncate">{v.name}</span>
                            <span className="font-mono font-bold text-teal-dark shrink-0">
                              {Number(v.additionalPrice) > 0
                                ? `+₹${Number(v.additionalPrice).toFixed(2)}`
                                : 'Included'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="w-full brutalist-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    Subscribe Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Plans Section */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-plum flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-accent" /> Supported Billing Plans
          </h2>
          <span className="text-[11px] text-muted">Active billing cycles</span>
        </div>

        {loadingPlans ? (
          <div className="p-4 text-center text-xs text-muted">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 bg-white border border-border rounded brutalist-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">{plan.name}</h4>
                    <span className="brutalist-badge bg-surface-secondary text-plum border border-border mt-1">
                      {plan.billingFrequency}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-teal-dark">
                    ₹{Number(plan.basePrice).toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-muted space-y-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{plan.allowPause ? 'Self-service pause supported' : 'Standard term'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-teal-accent" />
                    <span>{plan.allowRenewal ? 'Automatic cycle renewal' : 'Fixed contract'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration & Subscribe Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-lg border border-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-dark block">
                  New Subscription
                </span>
                <h3 className="text-base font-bold text-charcoal">
                  Configure {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-muted hover:text-charcoal font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs rounded font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Select Billing Frequency Plan *
                </label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="brutalist-input"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billingFrequency}) — Base ₹{Number(p.basePrice).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Select Edition / Add-on Variant
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="brutalist-input"
                  >
                    <option value="">Standard Edition (+₹0.00)</option>
                    {selectedProduct.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (+₹{Number(v.additionalPrice).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Seats / License Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="brutalist-input font-bold"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="p-3 bg-surface-secondary border border-border rounded text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Application Base Price:</span>
                  <span className="font-semibold text-charcoal">₹{unitSalesPrice.toFixed(2)}</span>
                </div>
                {variantAdditional > 0 && (
                  <div className="flex justify-between text-teal-dark">
                    <span>Variant Add-on ({activeVariant?.name}):</span>
                    <span className="font-semibold">+₹{variantAdditional.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Quantity:</span>
                  <span className="font-semibold text-charcoal">{quantity}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted">Cycle Subtotal:</span>
                  <span className="font-semibold text-charcoal">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Applicable GST / Tax (10%):</span>
                  <span className="font-semibold text-charcoal">₹{estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border text-sm font-bold text-plum">
                  <span>Recurring Total ({activePlan?.billingFrequency || 'Cycle'}):</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="brutalist-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {subscribeMutation.isPending ? 'Activating...' : 'Confirm & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
