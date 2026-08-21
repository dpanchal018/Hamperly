'use client';

import React, { useEffect, useState } from 'react';
import { useSelection } from '@/contexts/SelectionContext';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, Sparkles, AlertCircle, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { 
  THEMES, 
  COLOR_PALETTES, 
  PACKAGING_OPTIONS, 
  RIBBON_OPTIONS, 
  RECIPIENT_OPTIONS 
} from '@/config/personalization.config';
import { PageTransition } from '@/components/ui/AnimatedWrapper';
import { generateHamper } from '@/actions/personalize.actions';
import { Phase6HandoffContract } from '@/types/personalization.types';

export default function ReviewPage() {
  const { items, personalization, totalItems } = useSelection();
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<Phase6HandoffContract | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0 && !successPayload) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBasket className="w-16 h-16 text-slate-300 mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Hamper is Empty</h1>
        <p className="text-slate-500 mb-8 max-w-md">Please add some products to your hamper.</p>
        <Link href="/products">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-8 h-12">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }



  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await generateHamper({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        personalization
      });
      
      if (response.success && response.handoffPayload) {
        // Save handoff payload to local storage for the generate screen to pick up
        localStorage.setItem('hamperly_handoff_payload', JSON.stringify(response.handoffPayload));
        // Handoff to Phase 6 Designer Agent
        router.push(`/design/generate/${response.handoffPayload.hamperId}`);
      } else if (response.error === 'UNAUTHENTICATED') {
        // Phase 6 constraint: Must be logged in to save and generate design
        router.push(`/login?redirectTo=/review`);
      } else {
        setError(response.error || 'Failed to prepare hamper.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Safe lookups for labels
  const themeLabel = THEMES.find(t => t.value === personalization.theme)?.label || personalization.theme;
  const colorLabel = COLOR_PALETTES.find(c => c.value === personalization.colorPalette)?.label || personalization.colorPalette;
  const packageLabel = PACKAGING_OPTIONS.find(p => p.value === personalization.packaging)?.label || personalization.packaging;
  const ribbonLabel = RIBBON_OPTIONS.find(r => r.value === personalization.ribbon)?.label || personalization.ribbon;
  const recipientLabel = RECIPIENT_OPTIONS.find(r => r.value === personalization.recipient)?.label || personalization.recipient;

  if (successPayload) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-green-50 text-green-800 p-8 rounded-3xl border border-green-200 shadow-sm mb-8 inline-block w-full">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl font-bold mb-4">Ready for AI Generation!</h1>
            <p className="text-lg mb-6">
              Your hamper configuration is complete and ready for the AI Designer in Phase 6.
            </p>
            <div className="bg-white p-6 rounded-xl text-left overflow-x-auto shadow-inner text-sm text-slate-700 font-mono">
              <pre>{JSON.stringify(successPayload, null, 2)}</pre>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Review Your Hamper
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Review your selections and styling choices before we generate your final masterpiece.
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-rose-700 font-medium">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Products Summary */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900">Your Items</h2>
              <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-sm">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center py-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.product.name}</p>
                    <p className="text-slate-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/build">
              <Button variant="outline" size="sm" className="w-full text-slate-600 border-slate-300 font-bold">
                Edit Items
              </Button>
            </Link>
          </div>

          {/* Personalization Summary */}
          <div className="bg-rose-50 rounded-3xl p-6 md:p-8 shadow-xl border border-rose-100">
            <div className="flex justify-between items-center border-b border-rose-200 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900">Style & Personalization</h2>
            </div>
            
            <dl className="space-y-4 mb-8">
              <div>
                <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Style Theme</dt>
                <dd className="font-bold text-slate-900 text-lg">{themeLabel}</dd>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Color Palette</dt>
                  <dd className="font-bold text-slate-900 flex items-center">
                    <span 
                      className="w-4 h-4 rounded-full mr-2 border border-slate-300 inline-block"
                      style={{ backgroundColor: COLOR_PALETTES.find(c => c.value === personalization.colorPalette)?.hex }}
                    />
                    {colorLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Packaging</dt>
                  <dd className="font-bold text-slate-900">{packageLabel}</dd>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Ribbon</dt>
                  <dd className="font-bold text-slate-900">{ribbonLabel}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">For</dt>
                  <dd className="font-bold text-slate-900">{recipientLabel}</dd>
                </div>
              </div>

              {personalization.personalMessage && (
                <div className="pt-2">
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Message</dt>
                  <dd className="bg-white p-4 rounded-xl text-slate-700 italic border border-slate-200 shadow-inner whitespace-pre-wrap text-sm leading-relaxed">
                    "{personalization.personalMessage}"
                  </dd>
                </div>
              )}
            </dl>
            
            <Link href="/personalize">
              <Button variant="outline" size="sm" className="w-full text-slate-600 border-rose-300 hover:bg-rose-100 font-bold bg-transparent">
                Edit Personalization
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-12 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 border-t border-slate-200 pt-8">
          <Link 
            href="/personalize" 
            className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto h-14 px-8 text-slate-600 font-bold hover:bg-slate-100 rounded-xl" })}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Link>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold text-lg"
          >
            {isGenerating ? 'Validating...' : 'Generate My Hamper'} 
            {!isGenerating && <Sparkles className="w-5 h-5 ml-2 text-rose-300" />}
          </Button>
        </div>

      </div>
    </PageTransition>
  );
}
