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
            className="rounded-full shadow-2xl bg-card hover:bg-secondary text-foreground flex items-center pr-2 pl-4 py-6 border border-border"
            onClick={() => setIsOpen(true)}
          >
            <div className="flex flex-col items-start mr-4">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Hamper</span>
              <span className="font-bold text-foreground">{totalItems} item{totalItems !== 1 && 's'}</span>
            </div>
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            {/* Slide-over */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-background shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-card">
                <div className="flex items-center space-x-3">
                  <div className="bg-secondary p-2 rounded-full text-primary">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold font-serif text-foreground">Your Selection</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-secondary">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex space-x-4">
                    <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden border border-border flex-shrink-0">
                      {item.product.primary_image_url ? (
                        <img src={item.product.primary_image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <Link href={`/products/${item.product.slug}`} onClick={() => setIsOpen(false)} className="font-bold text-foreground hover:text-primary line-clamp-2 pr-4 text-sm font-serif">
                          {item.product.name}
                        </Link>
                        <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-end">
                        
                        <div className="flex items-center space-x-3 bg-secondary rounded-full border border-border px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-foreground">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock_quantity}
                            className={`text-muted-foreground ${item.quantity >= item.product.stock_quantity ? 'opacity-50 cursor-not-allowed' : 'hover:text-foreground transition-colors'}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-border bg-secondary/50">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-foreground">
                    <span>Estimated Total</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Final hamper price will be calculated in the next step.</p>
                </div>
                
                {/* CTA linking to the full builder */}
                <Link href="/build">
                  <Button className="w-full h-14 text-lg font-bold bg-primary hover:opacity-90 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all" onClick={() => setIsOpen(false)}>
                    Review Hamper <ArrowRight className="w-5 h-5 ml-2" />
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
