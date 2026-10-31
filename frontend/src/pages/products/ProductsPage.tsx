import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Product, ProductType } from '../../types';
import { Plus, Package, Layers, Tag, X, Archive, Check } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'SOFTWARE' as ProductType,
    salesPrice: 100,
    costPrice: 30,
    notes: '',
  });

  const [variantData, setVariantData] = useState({
    name: '',
    description: '',
    additionalPrice: 0,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/products?includeArchived=true'),
  });

  const createProductMutation = useMutation({
    mutationFn: (newProduct: typeof formData) => api.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateOpen(false);
      setFormData({
        name: '',
        code: '',
        type: 'SOFTWARE',
        salesPrice: 100,
        costPrice: 30,
        notes: '',
      });
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: typeof variantData }) =>
      api.post(`/products/${productId}/variants`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProductForVariant(null);
      setVariantData({ name: '', description: '', additionalPrice: 0 });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(formData);
  };

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForVariant) return;
    createVariantMutation.mutate({
      productId: selectedProductForVariant.id,
      data: variantData,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">
            PRODUCT & VARIANT CATALOG
          </h1>
          <p className="text-xs text-muted font-medium">
            Manage software offerings, subscription add-ons, cost baselines, and multi-tier pricing variants
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="brutalist-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 text-center py-10 text-xs text-muted">Loading catalog...</div>
        ) : (
          (products || []).map((product) => (
            <div
              key={product.id}
              className={`brutalist-card p-5 bg-white border ${
                product.isArchived ? 'border-dashed border-gray-300 opacity-75' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-charcoal">{product.name}</h3>
                    <span className="brutalist-badge bg-surface-secondary text-plum border border-border">
                      {product.type}
                    </span>
                    {product.isArchived && (
                      <span className="brutalist-badge bg-gray-200 text-gray-700">Archived</span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-semibold text-muted block mt-0.5">
                    Code: {product.code}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-plum block">
                    ${Number(product.salesPrice).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-muted block">
                    Cost: ${Number(product.costPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              {product.notes && (
                <p className="mt-2 text-xs text-muted line-clamp-2">{product.notes}</p>
              )}

              {/* Variants Section */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-accent" />
                    Configurable Variants ({product.variants?.length || 0})
                  </span>
                  {!product.isArchived && (
                    <button
                      onClick={() => setSelectedProductForVariant(product)}
                      className="text-xs font-bold text-teal-accent hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Variant
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(product.variants || []).map((v) => (
                    <div
                      key={v.id}
                      className="p-2 bg-surface-secondary border border-border rounded flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-charcoal">{v.name}</span>
                        {v.description && (
                          <span className="text-[10px] text-muted block truncate">
                            {v.description}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-teal-dark shrink-0">
                        {Number(v.additionalPrice) > 0
                          ? `+$${Number(v.additionalPrice).toFixed(2)}`
                          : 'Included ($0.00)'}
                      </span>
                    </div>
                  ))}
                  {(product.variants || []).length === 0 && (
                    <p className="text-[11px] text-muted italic">No variants configured.</p>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                {!product.isArchived && (
                  <button
                    onClick={() => archiveMutation.mutate(product.id)}
                    className="brutalist-btn-danger text-xs py-1 px-2.5"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive Product
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Product Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-md border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Create Catalog Product
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded text-muted hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Business Suite Pro"
                  className="brutalist-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="BL-SUITE"
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                    className="brutalist-input"
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="ADDON">ADDON</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Sales Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.salesPrice}
                    onChange={(e) => setFormData({ ...formData, salesPrice: parseFloat(e.target.value) || 0 })}
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                    Cost Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Notes / Description
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Included features, SLA specs, or licensing notes..."
                  rows={3}
                  className="brutalist-input"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="brutalist-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="brutalist-btn-primary"
                >
                  {createProductMutation.isPending ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="brutalist-card bg-white w-full max-w-md border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                  Add Product Variant
                </h3>
                <span className="text-xs text-plum font-semibold">
                  For: {selectedProductForVariant.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedProductForVariant(null)}
                className="p-1 rounded text-muted hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Variant Name * (e.g. Brand: Odoo Edition)
                </label>
                <input
                  type="text"
                  required
                  value={variantData.name}
                  onChange={(e) => setVariantData({ ...variantData, name: e.target.value })}
                  placeholder="Brand: Odoo Edition"
                  className="brutalist-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Additional Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={variantData.additionalPrice}
                  onChange={(e) =>
                    setVariantData({ ...variantData, additionalPrice: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="560.00"
                  className="brutalist-input"
                />
                <span className="text-[10px] text-muted block mt-1">
                  Added to base product sales price (${Number(selectedProductForVariant.salesPrice).toFixed(2)})
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Variant Description
                </label>
                <input
                  type="text"
                  value={variantData.description}
                  onChange={(e) => setVariantData({ ...variantData, description: e.target.value })}
                  placeholder="Full Odoo connector & priority queue"
                  className="brutalist-input"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForVariant(null)}
                  className="brutalist-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVariantMutation.isPending}
                  className="brutalist-btn-teal"
                >
                  {createVariantMutation.isPending ? 'Adding...' : 'Save Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
