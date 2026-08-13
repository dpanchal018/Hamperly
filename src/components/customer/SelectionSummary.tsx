'use client';

import { useSelection } from '@/contexts/SelectionContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
          <Button 
            size="lg" 
            className="rounded-full shadow-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center pr-2 pl-4 py-6"
            onClick={() => setIsOpen(true)}
          >
            <div className="flex flex-col items-start mr-4">
              <span className="text-xs text-slate-300 font-medium">Your Hamper</span>
              <span className="font-bold">{totalItems} item{totalItems !== 1 && 's'}</span>
            </div>
            <div className="bg-rose-500 rounded-full w-10 h-10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </Button>
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
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            />
            
            {/* Slide-over */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Your Selection</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex space-x-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      {item.product.primary_image_url ? (
                        <img src={item.product.primary_image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <Link href={`/products/${item.product.slug}`} onClick={() => setIsOpen(false)} className="font-bold text-slate-900 hover:text-rose-600 line-clamp-2 pr-4 text-sm">
                          {item.product.name}
                        </Link>
                        <button onClick={() => removeItem(item.product.id)} className="text-slate-400 hover:text-rose-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-bold text-slate-700">₹{item.product.selling_price.toFixed(2)}</span>
                        
                        <div className="flex items-center space-x-3 bg-slate-50 rounded-full border border-slate-200 px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-slate-500 hover:text-slate-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock_quantity}
                            className={`text-slate-500 ${item.quantity >= item.product.stock_quantity ? 'opacity-50 cursor-not-allowed' : 'hover:text-slate-900'}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-slate-900">
                    <span>Estimated Total</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Final hamper price will be calculated in the next step.</p>
                </div>
                
                {/* Temporary CTA since Phase 3 doesn't include the final checkout/builder */}
                <Button className="w-full h-14 text-lg font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all" onClick={() => alert("Hamper Builder coming in future phase!")}>
                  Continue to Builder <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
