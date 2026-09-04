'use client';

import React, { useState, useMemo } from 'react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { PublicProduct } from '@/services/catalog.service';
import { Category } from '@/types/database.types';
import { Plus, Minus, Check, Search, ArrowRight, ArrowLeft, Package, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Props {
  products: PublicProduct[];
  categories: Category[];
}

export function StepProducts({ products, categories }: Props) {
  const { 
    selectedProducts, 
    addProduct, 
    updateProductQuantity, 
    removeProduct, 
    totalProductsCount, 
    productsSubtotal,
    nextStep, 
    prevStep 
  } = useHamperBuilder();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Quick map to lookup quantity
  const productQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    selectedProducts.forEach(item => map.set(item.product.id, item.quantity));
    return map;
  }, [selectedProducts]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-rose-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          Step 02 of 05
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Select Your Curated Gifts
        </h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-light">
          Add treats, keepsakes, and artisanal items to fill your personalized hamper.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or flavor..."
            className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
          />
        </div>

        {/* Category Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.category_id === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Action/Navigation Bar - Moved to top per request */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-24 z-30">
        <Button
          variant="outline"
          onClick={prevStep}
          className="rounded-full px-6 h-12 text-slate-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block font-light">
              {totalProductsCount} item{totalProductsCount !== 1 ? 's' : ''} added
            </span>
            <span className="text-base font-bold text-slate-900">
              Subtotal: ₹{productsSubtotal.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={nextStep}
            disabled={totalProductsCount === 0}
            className="rounded-full px-8 h-12 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base shadow-lg shadow-rose-200 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span>Customize Hamper</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No products found</h3>
          <p className="text-slate-500 text-sm mt-1">Try clearing your search query or choosing another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const quantityInHamper = productQuantityMap.get(product.id) || 0;
            const isSelected = quantityInHamper > 0;
            const isOutOfStock = product.stock_quantity !== null && product.stock_quantity <= 0;
            const isLowStock = product.stock_quantity !== null && product.stock_quantity > 0 && product.stock_quantity <= 5;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-600 shadow-lg shadow-rose-50'
                    : isOutOfStock
                    ? 'border-slate-100 opacity-60'
                    : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Image Section */}
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
                  {product.primary_image_url ? (
                    <Image
                      src={product.primary_image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {isOutOfStock ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                        Only {product.stock_quantity} left
                      </span>
                    ) : null}
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-rose-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {product.category?.name || 'Gifting'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-400 block font-light">Price</span>
                      <span className="text-lg font-bold text-slate-900">
                        ₹{product.selling_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Action button */}
                    {isOutOfStock ? (
                      <Button disabled size="sm" variant="outline" className="rounded-full text-xs opacity-50">
                        Unavailable
                      </Button>
                    ) : isSelected ? (
                      <div className="flex items-center bg-rose-50 border border-rose-200 rounded-full px-2 py-1 gap-2">
                        <button
                          onClick={() => updateProductQuantity(product.id, quantityInHamper - 1)}
                          className="w-6 h-6 rounded-full bg-white text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-rose-700 text-sm min-w-[16px] text-center">
                          {quantityInHamper}
                        </span>
                        <button
                          onClick={() => updateProductQuantity(product.id, quantityInHamper + 1)}
                          disabled={product.stock_quantity !== null && quantityInHamper >= product.stock_quantity}
                          className="w-6 h-6 rounded-full bg-white text-rose-600 flex items-center justify-center hover:bg-rose-100 disabled:opacity-40 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addProduct(product)}
                        className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
