'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSelection } from '@/contexts/SelectionContext';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/AnimatedWrapper';
import { ArrowRight, Minus, Plus, ShoppingBag, X, AlertTriangle, Gift } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';

export default function BuildHamperPage() {
  const { items, updateQuantity, removeItem, totalPrice, isValidating, issues } = useSelection();

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mb-8 mx-auto">
            <Gift className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Your hamper is waiting for something special.</h1>
          <p className="text-xl text-slate-500 max-w-lg mx-auto mb-10 leading-relaxed">
            Start picking the finest products to craft a beautiful, bespoke hamper for your loved ones.
          </p>
          <Link href="/products">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all">
              Explore Products <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-slate-50 min-h-screen pb-24">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Review Your Hamper</h1>
            <p className="text-slate-500 mt-2 text-lg">Curate the perfect selection before personalization.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-10">
          
          {/* Validation Issues Alert */}
          {issues.length > 0 && (
            <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-orange-900">Please review your selection</h4>
                <ul className="mt-1 space-y-1 text-sm text-orange-800">
                  {issues.map((issue, idx) => (
                    <li key={idx}>• {issue.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => {
                const isOutOfStock = item.product.stock_quantity <= 0;
                return (
                  <div key={item.product.id} className={`bg-white rounded-3xl p-6 border ${isOutOfStock ? 'border-red-200' : 'border-slate-100'} shadow-sm flex flex-col sm:flex-row items-start gap-6 relative transition-all`}>
                    
                    <button 
                      onClick={() => removeItem(item.product.id)}
                      className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-full transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden flex-shrink-0 border border-slate-100">
                      {item.product.primary_image_url ? (
                        <Image 
                          src={item.product.primary_image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {item.product.category?.name || 'Item'}
                        </span>
                        {item.product.stock_quantity < 5 && item.product.stock_quantity > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                            Low Stock
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/products/${item.product.slug}`} className="hover:text-rose-600 transition-colors">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{item.product.name}</h3>
                      </Link>
                      
                      {/* Price hidden until personalization phase */}

                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center space-x-4 bg-slate-50 rounded-full border border-slate-200 px-3 py-1.5">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock_quantity}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${item.quantity >= item.product.stock_quantity ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-200'}`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Line total hidden until personalization phase */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Hamper Summary</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Items</span>
                    <span className="font-bold text-slate-900">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 text-center font-medium">
                      Pricing and taxes will be calculated during the personalization step.
                    </p>
                  </div>
                </div>
                
                <Link href={isValidating || issues.some(i => i.type === 'INSUFFICIENT_STOCK' || i.type === 'PRODUCT_NOT_FOUND') ? "#" : "/personalize"}>
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all mb-4"
                    disabled={isValidating || issues.some(i => i.type === 'INSUFFICIENT_STOCK' || i.type === 'PRODUCT_NOT_FOUND')}
                  >
                    Personalize My Hamper <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                
                <Link href="/products" className="block text-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  Continue Browsing
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
