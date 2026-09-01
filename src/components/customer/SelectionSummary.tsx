'use client';

import { useSelection } from '@/contexts/SelectionContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Plus, Minus, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export function SelectionSummary() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useSelection();
  const [isOpen, setIsOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Action Button for Mobile / Quick Access */}
      {!isOpen && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-rose-200/80 text-slate-900 shadow-xl shadow-rose-900/10 hover:shadow-rose-900/20 hover:border-rose-300 rounded-full px-5 py-3 transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600">Hamper Draft</span>
              <span className="text-sm font-serif font-bold text-slate-900">{totalItems} Item{totalItems !== 1 ? 's' : ''} Selected</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 group-hover:bg-rose-700 transition-colors">
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </button>
        </motion.div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100]"
            />
            
            {/* Slide-over */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[101] flex flex-col rounded-l-3xl border-l border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-900 leading-tight">Your Selection</h2>
                    <span className="text-xs text-slate-500">Pick items to curate your bespoke hamper</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.product.id} 
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4 hover:border-rose-200 transition-colors"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 relative">
                      {item.product.primary_image_url ? (
                        <Image 
                          src={item.product.primary_image_url} 
                          alt={item.product.name} 
                          fill
                          sizes="64px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/products/${item.product.slug}`} 
                        onClick={() => setIsOpen(false)} 
                        className="font-serif font-bold text-slate-900 hover:text-rose-600 text-sm line-clamp-1 transition-colors block"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        ₹{item.product.selling_price.toFixed(2)} each
                      </p>
                      <p className="text-xs font-bold text-rose-600 mt-0.5">
                        Total: ₹{(item.product.selling_price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => removeItem(item.product.id)} 
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center space-x-1.5 bg-slate-100 rounded-full px-2 py-1 border border-slate-200">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-slate-600 hover:text-rose-600 shadow-xs transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity}
                          className={`w-5 h-5 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-xs transition-colors ${
                            item.quantity >= item.product.stock_quantity ? 'opacity-40 cursor-not-allowed' : 'hover:text-rose-600'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200/80 bg-white space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Products Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                    <span className="font-serif font-bold text-slate-900 text-base">Estimated Total</span>
                    <span className="font-serif font-bold text-2xl text-rose-600">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    Packaging & personal message will be added in the Hamper Studio.
                  </p>
                </div>
                
                {/* CTA linking to the full builder */}
                <Link href="/build" className="block">
                  <Button 
                    className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full shadow-lg shadow-rose-200 text-base transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer" 
                    onClick={() => setIsOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Review & Build Hamper</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
