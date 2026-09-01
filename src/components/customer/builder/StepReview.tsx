'use client';

import React, { useState } from 'react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { useCart } from '@/contexts/CartContext';
import { CustomizationCategory } from '@/types/customization.types';
import { validateAndConfirmHamper } from '@/actions/hamper-creation.actions';
import { 
  Package, Heart, Sparkles, Sliders, MessageSquare, 
  Edit3, ArrowRight, ArrowLeft, ShoppingBag, CheckCircle, AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Props {
  customizationCategories: CustomizationCategory[];
}

export function StepReview({ customizationCategories }: Props) {
  const { 
    draftId,
    editingCartId,
    occasion, 
    selectedProducts, 
    selectedCustomizations, 
    personalMessage, 
    recipient, 
    productsSubtotal,
    customizationsSubtotal,
    totalPrice,
    totalProductsCount,
    setCurrentStep,
    prevStep,
    resetBuilder
  } = useHamperBuilder();

  const { addItem, updateItem, setIsCartOpen } = useCart();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Collect customization labels and prices
  const activeCustomizationDetails = React.useMemo(() => {
    const list: { categoryName: string; optionName: string; price: number }[] = [];
    customizationCategories.forEach(cat => {
      const selectedOptionIds = selectedCustomizations[cat.id] || [];
      selectedOptionIds.forEach(optId => {
        const opt = (cat.options || []).find(o => o.id === optId);
        if (opt) {
          list.push({
            categoryName: cat.name,
            optionName: opt.name,
            price: Number(opt.price) || 0
          });
        }
      });
    });
    return list;
  }, [customizationCategories, selectedCustomizations]);

  const handleConfirmAndAddToCart = async () => {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const result = await validateAndConfirmHamper({
        draftId: editingCartId || draftId,
        occasionId: occasion?.id,
        products: selectedProducts.map(p => ({ productId: p.product.id, quantity: p.quantity })),
        selectedCustomizations,
        personalMessage,
        recipient
      });

      if (!result.success || !result.validatedHamper) {
        setConfirmError(result.error || 'Failed to validate hamper configuration.');
        toast.error(result.error || 'Failed to validate hamper.');
        setIsConfirming(false);
        return;
      }

      const valid = result.validatedHamper;

      // Prepare Cart item payload
      const cartItemPayload = {
        id: valid.id,
        name: valid.name,
        price: valid.totalPrice,
        imageUrl: valid.products[0]?.imageUrl || null,
        maxQuantity: 10,
        itemType: 'PERSONALIZED_HAMPER' as const,
        occasion: valid.occasion || undefined,
        products: valid.products,
        customizations: valid.customizations,
        personalMessage: valid.personalMessage || undefined,
        recipient: valid.recipient || undefined,
        productsSubtotal: valid.productsSubtotal,
        customizationsSubtotal: valid.customizationsSubtotal
      };

      if (editingCartId) {
        if (updateItem) {
          updateItem(editingCartId, cartItemPayload);
        } else {
          addItem(cartItemPayload, 1);
        }
        toast.success('Personalized hamper updated in bag!');
      } else {
        addItem(cartItemPayload, 1);
        toast.success('Personalized hamper added to bag!');
      }

      resetBuilder();
      setIsCartOpen(true);
    } catch (err: any) {
      console.error('Hamper confirmation error:', err);
      setConfirmError(err.message || 'An unexpected error occurred.');
      toast.error(err.message || 'Failed to confirm hamper.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-rose-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          Step 05 of 05
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">
          Review Your Hamper
        </h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-light">
          Review every detail before confirming your bespoke personalized hamper.
        </p>
      </div>

      {confirmError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{confirmError}</span>
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Occasion Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occasion</span>
                <h3 className="text-lg font-bold text-slate-900">{occasion?.name || 'General Celebration'}</h3>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              data-testid="edit-occasion-btn"
              onClick={() => setCurrentStep(1)}
              className="rounded-full text-slate-500 hover:text-rose-600 text-xs flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>

          {/* Products Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Selected Products ({totalProductsCount})
                </h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="edit-products-btn"
                onClick={() => setCurrentStep(2)}
                className="rounded-full text-slate-500 hover:text-rose-600 text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedProducts.map((item) => (
                <div key={item.product.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden relative flex items-center justify-center shrink-0 border border-slate-100">
                      {item.product.primary_image_url ? (
                        <Image
                          src={item.product.primary_image_url}
                          alt={item.product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                      <span className="text-xs text-slate-500 font-light">Qty: {item.quantity} × ₹{item.product.selling_price.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{(item.product.selling_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-semibold text-slate-700">
              <span>Products Subtotal</span>
              <span>₹{productsSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Customizations Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base">Customization Style</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="edit-customizations-btn"
                onClick={() => setCurrentStep(3)}
                className="rounded-full text-slate-500 hover:text-rose-600 text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>

            {activeCustomizationDetails.length === 0 ? (
              <p className="text-sm text-slate-400 font-light py-2">No custom add-ons chosen.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeCustomizationDetails.map((cust, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                        {cust.categoryName}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm">{cust.optionName}</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {cust.price > 0 ? `+ ₹${cust.price.toFixed(2)}` : 'Included'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-semibold text-slate-700">
              <span>Customizations Subtotal</span>
              <span>₹{customizationsSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Personal Message Preview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base">Personal Message</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="edit-message-btn"
                onClick={() => setCurrentStep(4)}
                className="rounded-full text-slate-500 hover:text-rose-600 text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>

            {recipient && (
              <p className="text-xs text-slate-500">
                <strong>Recipient:</strong> {recipient}
              </p>
            )}

            {personalMessage ? (
              <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100 text-slate-800 text-sm italic">
                "{personalMessage}"
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-light italic">No personal message attached.</p>
            )}
          </div>
        </div>

        {/* Right Column (Live Order Summary & Action) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100 space-y-6 sticky top-28">
            <h3 className="text-xl font-bold font-serif text-slate-900 pb-4 border-b border-slate-100">
              Hamper Price Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Products ({totalProductsCount} items)</span>
                <span className="font-semibold text-slate-900">₹{productsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Packaging & Style</span>
                <span className="font-semibold text-slate-900">₹{customizationsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Estimation</span>
                <span className="text-slate-400 text-xs">Calculated at checkout</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Hamper Total</span>
                <span className="text-2xl font-black text-rose-600">
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleConfirmAndAddToCart}
              disabled={isConfirming}
              className="w-full rounded-full py-4 h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              {isConfirming ? (
                <span>Validating & Adding...</span>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>{editingCartId ? 'Update Hamper in Bag' : 'Confirm & Add to Bag'}</span>
                </>
              )}
            </Button>

            <p className="text-[11px] text-slate-400 text-center font-light leading-normal">
              Zero-risk personalization. Your chosen pieces and presentation are locked in at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
