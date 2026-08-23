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
      <PageTransition>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-background">
          <ShoppingBasket className="w-16 h-16 text-foreground/60/30 mb-6" strokeWidth={1} />
          <h1 className="text-3xl font-bold font-serif text-foreground mb-4">YOUR HAMPER IS EMPTY</h1>
          <p className="text-foreground/60 mb-8 max-w-md font-light">Curate your selection before adding personal touches.</p>
          <Link href="/products">
            <Button className="bg-primary hover:bg-primary text-white rounded-3xl px-12 h-14 font-bold text-primary text-xs font-semibold">
              Explore Products
            </Button>
          </Link>
        </div>
      </PageTransition>
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
        <div className="max-w-3xl mx-auto px-4 py-32 text-center bg-background">
          <div className="bg-primary/5 p-12 border border-primary/10 inline-block w-full">
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-3xl font-serif font-bold text-foreground mb-4 font-bold text-primary">Ready for AI Generation</h1>
            <p className="text-foreground/60 font-light mb-8 max-w-lg mx-auto">
              Your hamper configuration is complete and ready for the AI Designer in Phase 6.
            </p>
            <div className="bg-white p-6 text-left overflow-x-auto shadow-inner text-xs text-foreground/60 font-mono border border-primary/10">
              <pre>{JSON.stringify(successPayload, null, 2)}</pre>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Calculate pricing based on item list, packaging, ribbon
  const pkgPrice = 0;
  const ribbonPrice = 0;
  
  // Need to calculate items total based on base_price. 
  // Let's assume selection context provides this or we can calculate it manually
  let itemsTotal = 0;
  items.forEach(item => {
      itemsTotal += (item.product.selling_price || 0) * item.quantity;
  });

  const subtotal = itemsTotal + pkgPrice + ribbonPrice;

  return (
    <PageTransition>
      <div className="bg-background min-h-screen pt-32 pb-24 border-t border-primary/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-bold tracking-[0.3em] uppercase text-xs mb-6 block">Step 03</span>
            <h1 className="text-4xl md:text-5xl font-black text-foreground font-serif tracking-tight mb-6">
              THE FINAL REVIEW.
            </h1>
            <p className="text-lg md:text-xl font-light text-foreground/60 max-w-2xl mx-auto">
              Verify your selections before proceeding to design generation.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-6 bg-red-900/5 border border-red-900/20 text-red-900 flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white border border-primary/10 p-8 md:p-12 space-y-12 mb-8">
            
            <div className="border-b border-primary/10 pb-8">
              <h2 className="text-sm font-bold text-foreground font-bold text-primary mb-6 flex justify-between">
                <span>The Goods</span>
                <Link href="/build" className="text-foreground/60 hover:text-foreground font-semibold text-xs transition-colors">Edit</Link>
              </h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-4 text-foreground font-medium">
                      {item.quantity} × {item.product.name}
                    </div>
                    <div className="text-foreground/60 whitespace-nowrap">
                      ?{((item.product.selling_price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-primary/10 pb-8">
              <h2 className="text-sm font-bold text-foreground font-bold text-primary mb-6 flex justify-between">
                <span>Personalization</span>
                <Link href="/personalize" className="text-foreground/60 hover:text-foreground font-semibold text-xs transition-colors">Edit</Link>
              </h2>
              
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">Theme</dt>
                  <dd className="text-foreground font-medium">{themeLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">Color Palette</dt>
                  <dd className="text-foreground font-medium">{colorLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">Packaging (?{0})</dt>
                  <dd className="text-foreground font-medium">{packageLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">Ribbon (?{0})</dt>
                  <dd className="text-foreground font-medium">{ribbonLabel}</dd>
                </div>
                
                {personalization.recipient && (
                  <div className="md:col-span-2">
                    <dt className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">Intended For</dt>
                    <dd className="text-foreground font-medium">{recipientLabel}</dd>
                  </div>
                )}
                
                <div className="md:col-span-2 bg-primary/5 p-6 border border-primary/10 mt-4 relative">
                   <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/30"></div>
                   <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/30"></div>
                   <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/30"></div>
                   <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/30"></div>
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">To</div>
                        <div className="font-serif italic text-foreground">{personalization.recipientName || 'Not specified'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-1">From</div>
                        <div className="font-serif italic text-foreground">{personalization.senderName || 'Anonymous'}</div>
                      </div>
                   </div>
                   <div className="text-xs font-semibold text-foreground/60 font-bold text-primary mb-2 text-center mt-6">Personal Note</div>
                   <div className="font-serif italic text-foreground text-center text-lg leading-relaxed max-w-lg mx-auto">
                     "{personalization.personalMessage || 'A gift from the heart.'}"
                   </div>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-sm font-bold text-foreground font-bold text-primary mb-6">Summary</h2>
              <div className="space-y-3 text-sm text-foreground/60">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>?{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-light">
                  <span>Shipping & Taxes calculated at checkout</span>
                  <span>--</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-foreground pt-6 border-t border-primary/10 mt-6">
                  <span>Estimated Total</span>
                  <span>?{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <Link href="/personalize">
              <Button variant="outline" className="w-full sm:w-auto px-10 h-14 border-primary text-foreground hover:bg-primary hover:text-white rounded-3xl font-bold text-primary text-xs font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-12 h-14 bg-primary hover:bg-primary text-white rounded-3xl font-bold text-primary text-xs font-semibold relative overflow-hidden"
            >
              {isGenerating ? (
                <>
                  <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                  Preparing Hamper...
                </>
              ) : (
                <>
                  Proceed to AI Generation <Sparkles className="w-4 h-4 ml-3" strokeWidth={1.5} />
                </>
              )}
            </Button>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
