'use client';

import React from 'react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { CustomizationCategory } from '@/types/customization.types';
import { Check, ArrowRight, ArrowLeft, Sliders, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  customizationCategories: CustomizationCategory[];
}

export function StepCustomize({ customizationCategories }: Props) {
  const { 
    selectedCustomizations, 
    toggleCustomization, 
    customizationsSubtotal,
    nextStep, 
    prevStep 
  } = useHamperBuilder();

  // Validate that all required categories have at least 1 selection
  const missingRequiredCategories = customizationCategories.filter(cat => {
    if (!cat.is_required) return false;
    const selected = selectedCustomizations[cat.id] || [];
    return selected.length === 0;
  });

  const canProceed = missingRequiredCategories.length === 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-rose-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          Step 03 of 05
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Customize Your Hamper Style
        </h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-light">
          Tailor the presentation with luxury boxes, ribbons, cards, and finishing touches.
        </p>
      </div>

      {/* Required Validation Notice if needed */}
      {missingRequiredCategories.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Please make a selection for <strong>{missingRequiredCategories.map(c => c.name).join(', ')}</strong> before continuing.
          </span>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-10">
        {customizationCategories.map((category) => {
          const selectedOptionIds = selectedCustomizations[category.id] || [];
          const options = category.options || [];

          return (
            <div key={category.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Category Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold font-serif text-slate-900">{category.name}</h3>
                    {category.is_required ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Required
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        Optional
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500">
                      {category.allow_multiple ? 'Multiple selections allowed' : 'Choose one'}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-slate-500 text-sm mt-1">{category.description}</p>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {selectedOptionIds.length} selected
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {options.map((option) => {
                  const isSelected = selectedOptionIds.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleCustomization(category.id, option.id, category.allow_multiple)}
                      className={`relative p-5 rounded-2xl text-left border-2 transition-all duration-200 flex flex-col justify-between h-[150px] ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/40 shadow-md shadow-rose-100'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <h4 className={`font-bold text-base leading-snug ${isSelected ? 'text-rose-900' : 'text-slate-900'}`}>
                          {option.name}
                        </h4>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2 transition-colors ${
                          isSelected ? 'bg-rose-600 text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>
                      </div>

                      {option.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 my-1 font-light">
                          {option.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${
                          option.price > 0 ? 'text-emerald-700 font-bold' : 'text-slate-500'
                        }`}>
                          {option.price > 0 ? `+ ₹${option.price.toFixed(2)}` : 'Included (₹0)'}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={prevStep}
          className="rounded-full px-8 h-12 text-slate-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block font-light">Customization Add-ons</span>
            <span className="text-base font-bold text-slate-900">
              ₹{customizationsSubtotal.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={nextStep}
            disabled={!canProceed}
            className="rounded-full px-10 h-14 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base shadow-lg shadow-rose-200 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span>Add Personal Message</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
