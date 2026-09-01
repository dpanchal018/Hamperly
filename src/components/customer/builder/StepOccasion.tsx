'use client';

import React, { useState, useEffect } from 'react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { Occasion } from '@/types/database.types';
import { Sparkles, Check, ArrowRight, Heart, Gift } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Props {
  occasions: Occasion[];
}

export function StepOccasion({ occasions }: Props) {
  const { occasion, setOccasion, nextStep, totalProductsCount, setCurrentStep } = useHamperBuilder();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSelectOccasion = (occ: Occasion) => {
    setOccasion(occ);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-rose-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          Step 01 of 05
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          What are you celebrating?
        </h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-light">
          Choose an occasion to anchor the theme, packaging, and mood of your personalized hamper.
        </p>

        {isMounted && totalProductsCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <Gift className="w-4 h-4 text-rose-600" />
            <span>You have {totalProductsCount} item{totalProductsCount !== 1 ? 's' : ''} in your hamper draft.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {occasions.map((occ) => {
          const isSelected = isMounted && occasion?.id === occ.id;

          return (
            <button
              key={occ.id}
              onClick={() => handleSelectOccasion(occ)}
              className={`group relative rounded-3xl overflow-hidden text-left border-2 transition-all duration-300 focus:outline-none flex flex-col justify-between h-[220px] p-5 ${
                isSelected
                  ? 'border-rose-600 bg-rose-50/40 shadow-lg shadow-rose-100 scale-[1.02]'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Background Image / Gradient */}
              {occ.image_url ? (
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <Image
                    src={occ.image_url}
                    alt={occ.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-20 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-rose-50/30 z-0" />
              )}

              {/* Selection Checkmark */}
              <div className="relative z-10 flex justify-between items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  {isSelected ? <Check className="w-4 h-4" strokeWidth={3} /> : <Heart className="w-4 h-4" />}
                </div>

                {isSelected && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider">
                    Selected
                  </span>
                )}
              </div>

              {/* Text Info */}
              <div className="relative z-10">
                <h3 className="font-serif font-bold text-xl text-slate-900 mb-1 group-hover:text-rose-600 transition-colors">
                  {occ.name}
                </h3>
                {occ.description && (
                  <p className="text-xs text-slate-500 font-light line-clamp-2">
                    {occ.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-8 border-t border-slate-100">
        <Button
          onClick={nextStep}
          disabled={!occasion}
          className="rounded-full px-10 h-14 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base shadow-lg shadow-rose-200 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <span>{totalProductsCount > 0 ? 'Continue to Review Products' : 'Continue to Select Products'}</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
