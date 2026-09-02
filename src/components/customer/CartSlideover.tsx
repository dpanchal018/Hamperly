'use client';

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Minus, Plus, PackageOpen, Sparkles, Edit3, Heart, Sliders, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import { AuthModal } from './AuthModal';
import { SmartBundlePrompt } from './SmartBundlePrompt';

export function CartSlideover({ user }: { user?: any }) {
  const { isCartOpen, setIsCartOpen, items, removeItem, updateQuantity, subtotal, addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const hampersInCart = items.filter(i => i.itemType === 'PERSONALIZED_HAMPER' || i.itemType === 'HAMPER');
  const looseItemsCount = items.filter(i => i.itemType === 'PRODUCT').reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    if (isCartOpen && products.length === 0) {
      getStorefrontProducts().then(res => {
        if (res.products) setProducts(res.products);
      });
    }
  }, [isCartOpen, products.length]);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-xs z-[100] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform rounded-l-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center space-x-2 text-primary">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            <h2 className="text-xl font-bold font-serif">Your Bag</h2>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 bg-primary/5 rounded-full text-primary hover:bg-primary/10 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary/40">
                <ShoppingBag className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-foreground font-semibold text-lg">Your bag is empty.</p>
                <p className="text-slate-500 text-sm mt-1">Explore our collection or create a bespoke hamper.</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button 
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/build');
                  }}
                  className="rounded-full h-12 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Create a Hamper
                </Button>
                <Button 
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/hampers');
                  }}
                  variant="outline"
                  className="rounded-full h-12 text-sm font-semibold border-slate-200 text-slate-700"
                >
                  Browse Hampers
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bundle loose products into Hamper CTA */}
              {looseItemsCount > 0 && hampersInCart.length > 0 ? (
                <SmartBundlePrompt hampers={hampersInCart} looseItemsCount={looseItemsCount} />
              ) : looseItemsCount > 0 ? (
                <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/60 rounded-3xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm shadow-rose-100/50">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-rose-900 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5 text-rose-500" /> Bundle into a Hamper
                    </h4>
                    <p className="text-[11px] text-rose-700/80 mt-0.5 font-medium">Turn your loose bag items into a beautiful, personalized gift hamper.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push('/build?fromCart=true');
                    }}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs px-4 h-9 shadow-md shadow-rose-200 shrink-0 w-full sm:w-auto"
                  >
                    Build Hamper
                  </Button>
                </div>
              ) : null}
              {items.map((item) => {
                const isPersonalized = item.itemType === 'PERSONALIZED_HAMPER';

                return (
                  <div key={item.id} className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 space-y-3">
                    {/* Item Top Info */}
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center relative shrink-0 overflow-hidden border border-slate-100">
                        {item.imageUrl ? (
                          <Image 
                            src={item.imageUrl} 
                            alt={item.name} 
                            fill
                            sizes="80px"
                            className="object-cover" 
                          />
                        ) : (
                          <div className="text-rose-400">
                            {isPersonalized ? <Sparkles className="w-8 h-8" /> : item.itemType === 'PRODUCT' ? <PackageOpen className="w-8 h-8" /> : <ShoppingBag className="w-8 h-8" />}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col flex-1 min-w-0 justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <div>
                              {isPersonalized && item.occasion && (
                                <span className="inline-block text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full mb-1">
                                  {item.occasion.name}
                                </span>
                              )}
                              <h3 className="font-bold text-slate-900 pr-2 text-sm leading-tight line-clamp-2">
                                {item.name}
                              </h3>
                            </div>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-1"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-slate-900 font-bold text-sm">₹{item.price.toFixed(2)}</p>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                          <div className="flex items-center border border-slate-200 rounded-full w-fit bg-slate-50">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                              disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Edit button for Personalized Hampers */}
                          {isPersonalized && (
                            <button
                              onClick={() => {
                                setIsCartOpen(false);
                                router.push(`/build?editCartId=${item.id}`);
                              }}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Edit Hamper
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown list for Personalized Hamper */}
                    {isPersonalized && item.products && item.products.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-2xl space-y-2 text-xs border border-slate-100">
                        <div className="text-slate-500 font-semibold">
                          Products ({item.products.reduce((acc, p) => acc + p.quantity, 0)}):
                        </div>
                        <div className="space-y-1 text-slate-700">
                          {item.products.map((p, pIdx) => (
                            <div key={pIdx} className="flex justify-between">
                              <span className="truncate pr-2">• {p.name} × {p.quantity}</span>
                              <span className="shrink-0 font-medium">₹{(p.price * p.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {item.customizations && item.customizations.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 space-y-1">
                            <div className="text-slate-500 font-semibold">Customizations:</div>
                            {item.customizations.map((c, cIdx) => (
                              <div key={cIdx} className="flex justify-between text-slate-700">
                                <span className="truncate pr-2">• {c.categoryName}: {c.optionName}</span>
                                <span className="shrink-0 font-medium">{c.price > 0 ? `+₹${c.price.toFixed(2)}` : 'Included'}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.personalMessage && (
                          <div className="pt-2 border-t border-slate-200/60 text-slate-600 italic">
                            Message: "{item.personalMessage}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout Bar */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-100 shadow-lg space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500 font-light">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 text-base">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs font-light">
                <span>Shipping & Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                setIsCartOpen(false);
                router.push('/checkout');
              }}
              className="w-full rounded-full py-4 h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <span className="font-mono font-normal">|</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </Button>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
