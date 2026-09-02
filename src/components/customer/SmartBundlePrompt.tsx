'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PackageOpen, Gift, ShoppingBag, Check, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, CartItem } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';

interface Props {
  hampers: CartItem[];
  looseItemsCount: number;
}

export function SmartBundlePrompt({ hampers, looseItemsCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [merged, setMerged] = useState(false);
  const [selectedHamperId, setSelectedHamperId] = useState<string | null>(hampers[0]?.id || null);
  
  const { mergeLooseItemsIntoHamper, setIsCartOpen } = useCart();
  const router = useRouter();

  // If no loose items or hampers, don't show anything
  if (looseItemsCount === 0 || hampers.length === 0) {
    return null;
  }

  const handleMerge = () => {
    if (selectedHamperId) {
      setMerged(true);
      setTimeout(() => {
        mergeLooseItemsIntoHamper(selectedHamperId);
        setIsOpen(false);
      }, 1000); // 1 second for animation to finish
    }
  };

  const handleNewHamper = () => {
    setIsOpen(false);
    setIsCartOpen(false);
    router.push('/build?fromCart=true');
  };

  const handleBuySeparate = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  return (
    <>
      {isMinimized ? (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex justify-between items-center shadow-sm"
        >
          <span className="text-[11px] text-slate-600 font-medium flex items-center">
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Items kept separate.
          </span>
          <button 
            onClick={() => { setIsMinimized(false); setIsOpen(true); }}
            className="text-[11px] font-bold text-violet-600 hover:text-violet-700 flex items-center transition-colors"
          >
            <Sparkles className="w-3 h-3 mr-1" /> Bundle instead
          </button>
        </motion.div>
      ) : (
        /* The Glowing Trigger Card inside the Cart */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 border border-violet-200/60 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-400/10 via-fuchsia-400/10 to-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex-1 relative z-10">
            <h4 className="text-sm font-bold text-violet-900 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-violet-600 animate-pulse" /> 
              Smart Bundle Detected
            </h4>
            <p className="text-[11px] text-violet-700/80 mt-1 font-medium leading-relaxed">
              You have {looseItemsCount} loose item{looseItemsCount > 1 ? 's' : ''} and a hamper in your bag. Want to tuck {looseItemsCount > 1 ? 'them' : 'it'} inside?
            </p>
          </div>
          
          <Button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs px-5 h-9 shadow-md shadow-violet-200 shrink-0 w-full sm:w-auto relative z-10 font-semibold tracking-wide"
          >
            Review Options
          </Button>
        </motion.div>
      )}

      {/* The Interactive Modal */}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <AnimatePresence>
          {isOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
                />
              </Dialog.Overlay>
              
              <Dialog.Content asChild>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-2xl z-[110] overflow-hidden border border-slate-100 p-6 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Dialog.Title className="text-xl font-bold font-serif text-slate-900 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-violet-500" />
                        Bundle Options
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-slate-500 mt-1">
                        How would you like to handle your loose items?
                      </Dialog.Description>
                    </div>
                    <Dialog.Close asChild>
                      <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="space-y-4">
                    {/* Option 1: Merge into Existing */}
                    <div 
                      className={`relative overflow-hidden border-2 rounded-2xl p-4 transition-all duration-300 ${merged ? 'border-green-500 bg-green-50' : 'border-violet-200 bg-violet-50/50 hover:border-violet-400'}`}
                    >
                      {merged ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-4 text-green-600"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3"
                          >
                            <Check className="w-6 h-6" strokeWidth={3} />
                          </motion.div>
                          <span className="font-bold text-lg">Magically Merged!</span>
                          <span className="text-sm text-green-700/80 mt-1">Tucked perfectly into your hamper.</span>
                        </motion.div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0">
                            <PackageOpen className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-slate-900 text-sm">Tuck into existing hamper</h5>
                            <p className="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">
                              Instantly add the loose {looseItemsCount > 1 ? 'items' : 'item'} inside a hamper you've already built.
                            </p>
                            
                            {hampers.length > 1 ? (
                              <div className="mb-3">
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Hamper:</label>
                                <select 
                                  className="w-full text-sm rounded-xl border-slate-200 bg-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                  value={selectedHamperId || ''}
                                  onChange={(e) => setSelectedHamperId(e.target.value)}
                                >
                                  {hampers.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                  ))}
                                </select>
                              </div>
                            ) : null}

                            <Button 
                              onClick={handleMerge}
                              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md transition-all font-semibold"
                            >
                              Merge Items Now
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Option 2: Start New */}
                    <div className={`border rounded-2xl p-4 transition-all duration-300 ${merged ? 'opacity-50 pointer-events-none' : 'border-rose-100 bg-rose-50/30 hover:border-rose-300'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm">Start a brand new hamper</h5>
                            <p className="text-xs text-slate-500 mt-0.5">Build a second hamper from scratch.</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleNewHamper}
                            className="text-rose-600 hover:bg-rose-100 rounded-full"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Option 3: Buy Separately */}
                    <div className={`border rounded-2xl p-4 transition-all duration-300 ${merged ? 'opacity-50 pointer-events-none' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm">Buy them separately</h5>
                            <p className="text-xs text-slate-500 mt-0.5">Keep them exactly as they are.</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={handleBuySeparate}
                            className="text-slate-600 hover:bg-slate-100 rounded-full text-xs font-semibold"
                          >
                            Keep Separate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
