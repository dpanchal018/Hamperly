'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { useCart } from '@/contexts/CartContext';
import { useSearchParams } from 'next/navigation';
import { Occasion, Category } from '@/types/database.types';
import { PublicProduct } from '@/services/catalog.service';
import { CustomizationCategory } from '@/types/customization.types';
import { StepOccasion } from './StepOccasion';
import { StepProducts } from './StepProducts';
import { StepCustomize } from './StepCustomize';
import { StepPersonalize } from './StepPersonalize';
import { StepReview } from './StepReview';
import { Heart, Package, Sliders, MessageSquare, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  occasions: Occasion[];
  products: PublicProduct[];
  categories: Category[];
  customizationCategories: CustomizationCategory[];
}

const STEPS = [
  { step: 1, name: 'Occasion', icon: Heart },
  { step: 2, name: 'Products', icon: Package },
  { step: 3, name: 'Customize', icon: Sliders },
  { step: 4, name: 'Personalize', icon: MessageSquare },
  { step: 5, name: 'Review', icon: CheckCircle2 },
];

export function HamperStudio({ occasions, products, categories, customizationCategories }: Props) {
  const { 
    currentStep, 
    setCurrentStep, 
    occasion, 
    setOccasion, 
    selectedProducts, 
    selectedCustomizations,
    loadFromCartItem, 
    editingCartId,
    resetBuilder,
    totalPrice,
    totalProductsCount,
    loadFromCartLooseItems
  } = useHamperBuilder();

  const { items: cartItems, removeItem: removeCartItem } = useCart();
  const searchParams = useSearchParams();
  const loadedEditIdRef = useRef<string | null>(null);
  const loadedOccasionRef = useRef<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Smoothly scroll to top whenever currentStep changes
  useEffect(() => {
    if (!isMounted) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, isMounted]);

  // Step Completion & Accessibility Rules (Hydration Safe)
  const isOccasionComplete = isMounted && Boolean(occasion);
  const isProductsComplete = isOccasionComplete && selectedProducts.length > 0;
  const isCustomizeComplete = isProductsComplete && customizationCategories
    .filter(c => c.is_required)
    .every(c => (selectedCustomizations[c.id] || []).length > 0);

  const isStepAccessible = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    if (!isMounted) return false;
    if (stepNumber === 2) return isOccasionComplete;
    if (stepNumber === 3) return isProductsComplete;
    if (stepNumber === 4) return isCustomizeComplete;
    if (stepNumber === 5) return isCustomizeComplete;
    return false;
  };

  // Enforce step accessibility guard: prevent landing/staying on a locked step
  useEffect(() => {
    if (!isMounted) return;
    if (!isOccasionComplete && currentStep > 1) {
      setCurrentStep(1);
    } else if (!isProductsComplete && currentStep > 2) {
      setCurrentStep(2);
    } else if (!isCustomizeComplete && currentStep > 3) {
      setCurrentStep(3);
    }
  }, [isMounted, isOccasionComplete, isProductsComplete, isCustomizeComplete, currentStep, setCurrentStep]);

  // Handle URL params on mount
  useEffect(() => {
    if (!isMounted) return;

    const occSlug = searchParams.get('occasion');
    if (occSlug && occSlug !== loadedOccasionRef.current && !occasion) {
      const match = occasions.find(o => o.slug === occSlug || o.id === occSlug);
      if (match) {
        loadedOccasionRef.current = occSlug;
        setOccasion(match);
        setCurrentStep(2); // Jump to products
      }
    }

    const editId = searchParams.get('editCartId');
    if (editId && editId !== loadedEditIdRef.current) {
      const cartItem = cartItems.find(i => i.id === editId);
      if (cartItem) {
        loadedEditIdRef.current = editId;
        loadFromCartItem(cartItem);
      }
    }

    const fromCart = searchParams.get('fromCart');
    if (fromCart === 'true' && cartItems.some(i => i.itemType === 'PRODUCT')) {
      // Only do this once
      if (loadedEditIdRef.current !== 'fromCart') {
        loadedEditIdRef.current = 'fromCart';
        // Delay slightly to ensure context is ready
        setTimeout(() => {
           loadFromCartLooseItems(cartItems, products);
           cartItems.forEach(i => {
             if (i.itemType === 'PRODUCT') removeCartItem(i.id);
           });
        }, 50);
      }
    }
  }, [isMounted, searchParams, occasions, occasion, setOccasion, setCurrentStep, cartItems, loadFromCartItem, loadFromCartLooseItems, products, removeCartItem]);

  const displayStep = isMounted ? currentStep : 1;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/40 via-white to-slate-50 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Stepper Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 max-w-4xl mx-auto">
            {STEPS.map((s, idx) => {
              const isCurrent = displayStep === s.step;
              const isCompleted = displayStep > s.step && isStepAccessible(s.step);
              const Icon = s.icon;
              const isClickable = isStepAccessible(s.step);

              return (
                <React.Fragment key={s.step}>
                  <button
                    data-testid={`step-btn-${s.step}`}
                    onClick={() => {
                      if (isClickable) {
                        setCurrentStep(s.step);
                      }
                    }}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 text-xs md:text-sm font-bold transition-all focus:outline-none ${
                      isCurrent
                        ? 'text-rose-600'
                        : isClickable
                        ? 'text-slate-700 hover:text-rose-600 cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                        : isCompleted
                        ? 'bg-rose-100 text-rose-700'
                        : isClickable
                        ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                        : 'bg-slate-100 text-slate-300'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline">{s.name}</span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-[2px] mx-2 transition-colors ${
                      displayStep > s.step ? 'bg-rose-600' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Reset button if draft has data (Hydration guarded) */}
          {isMounted && (selectedProducts.length > 0 || occasion) && (
            <div className="flex justify-end max-w-4xl mx-auto mt-2">
              <button
                onClick={resetBuilder}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Start Over
              </button>
            </div>
          )}
        </div>

        {/* Step Renderer */}
        <div className="transition-all duration-300">
          {displayStep === 1 && <StepOccasion occasions={occasions} />}
          {displayStep === 2 && <StepProducts products={products} categories={categories} />}
          {displayStep === 3 && <StepCustomize customizationCategories={customizationCategories} />}
          {displayStep === 4 && <StepPersonalize />}
          {displayStep === 5 && <StepReview customizationCategories={customizationCategories} />}
        </div>
      </div>
    </div>
  );
}
