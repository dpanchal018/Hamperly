'use client';

import React, { useEffect, useState } from 'react';
import { useSelection } from '@/contexts/SelectionContext';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check, Box, Layout, Package, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { 
  THEMES, 
  COLOR_PALETTES, 
  PACKAGING_OPTIONS, 
  RIBBON_OPTIONS, 
  RECIPIENT_OPTIONS 
} from '@/config/personalization.config';
import { PersonalizationData } from '@/types/personalization.types';
import { PageTransition } from '@/components/ui/AnimatedWrapper';

export default function PersonalizePage() {
  const { items, personalization, setPersonalization } = useSelection();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
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
    );
  }

  const updateField = <K extends keyof PersonalizationData>(field: K, value: PersonalizationData[K]) => {
    setPersonalization({ [field]: value });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 250) {
      updateField('personalMessage', text);
    }
  };

  const OptionButton = ({ 
    selected, 
    onClick, 
    children,
    className = ""
  }: { 
    selected: boolean, 
    onClick: () => void, 
    children: React.ReactNode,
    className?: string
  }) => (
    <button
      onClick={onClick}
      className={`relative p-6 text-left border transition-all duration-300 focus:outline-none ${
        selected 
          ? 'border-primary bg-primary/5' 
          : 'border-primary/10 bg-white hover:border-primary/30'
      } ${className}`}
    >
      {selected && (
        <div className="absolute top-4 right-4 text-foreground">
          <Check className="w-4 h-4" strokeWidth={2} />
        </div>
      )}
      {children}
    </button>
  );

  return (
    <PageTransition className="min-h-screen pt-24 pb-8 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-24">
          <span className="text-gold font-bold tracking-[0.3em] uppercase text-xs mb-6 block">Step 02</span>
          <h1 className="text-5xl md:text-6xl font-black font-serif text-foreground tracking-tight mb-6">
            THE FINISHING TOUCH.
          </h1>
          <p className="text-lg md:text-xl font-light text-foreground/60 max-w-2xl mx-auto">
            Select the presentation details that elevate your gift.
          </p>
        </div>

        <div className="space-y-16">
          
          {/* Theme Selection */}
          <section>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2 font-bold text-primary">1. Style & Mood</h2>
            <p className="text-foreground/60 mb-8 font-light italic">The aesthetic direction of your presentation.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {THEMES.map((theme) => (
                <OptionButton
                  key={theme.value}
                  selected={personalization.theme === theme.value}
                  onClick={() => updateField('theme', theme.value)}
                >
                  <h3 className="font-bold text-foreground mb-2 font-bold text-primary text-xs">{theme.label}</h3>
                  <p className="text-sm text-foreground/60 font-light pr-6">{theme.description}</p>
                </OptionButton>
              ))}
            </div>
          </section>

          {/* Color Palette */}
          <section>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2 font-bold text-primary">2. Colour Story</h2>
            <p className="text-foreground/60 mb-8 font-light italic">Harmonize the elements.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {COLOR_PALETTES.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateField('colorPalette', color.value)}
                  className={`relative p-4 border transition-all duration-300 flex flex-col items-center justify-center space-y-4 focus:outline-none ${
                    personalization.colorPalette === color.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-primary/10 bg-white hover:border-primary/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full border border-primary/10 shadow-inner" style={{ backgroundColor: color.hex }} />
                  <span className="text-xs font-bold text-foreground font-bold text-primary">{color.label}</span>
                  {personalization.colorPalette === color.value && (
                    <div className="absolute top-3 right-3 text-foreground">
                      <Check className="w-3 h-3" strokeWidth={2} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Packaging */}
          <section>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2 font-bold text-primary">3. The Vessel</h2>
            <p className="text-foreground/60 mb-8 font-light italic">How your gifts are contained.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PACKAGING_OPTIONS.map((pkg) => (
                <OptionButton
                  key={pkg.value}
                  selected={personalization.packaging === pkg.value}
                  onClick={() => updateField('packaging', pkg.value)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 text-foreground/60">
                      {pkg.value === 'hamper-basket' && <ShoppingBasket className="w-6 h-6" strokeWidth={1.5} />}
                      {pkg.value === 'premium-gift-box' && <Package className="w-6 h-6" strokeWidth={1.5} />}
                      {pkg.value === 'wooden-tray' && <Box className="w-6 h-6" strokeWidth={1.5} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1 font-bold text-primary text-xs">{pkg.label}</h3>
                    </div>
                  </div>
                </OptionButton>
              ))}
            </div>
          </section>

          {/* Ribbon */}
          <section>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2 font-bold text-primary">4. Ribbon Detail</h2>
            <p className="text-foreground/60 mb-8 font-light italic">The final wrapping.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {RIBBON_OPTIONS.map((ribbon) => (
                <OptionButton
                  key={ribbon.value}
                  selected={personalization.ribbon === ribbon.value}
                  onClick={() => updateField('ribbon', ribbon.value)}
                  className="text-center"
                >
                  <h3 className="font-bold text-foreground mb-1 font-bold text-primary text-xs">{ribbon.label}</h3>
                </OptionButton>
              ))}
            </div>
          </section>

          {/* Message & Recipient */}
          <section>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2 font-bold text-primary">5. The Sentiment</h2>
            <p className="text-foreground/60 mb-8 font-light italic">A personal note.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-xs font-bold text-foreground font-bold text-primary mb-3">To</label>
                <input 
                  type="text" 
                  value={personalization.recipientName || ''}
                  onChange={(e) => updateField('recipientName', e.target.value)}
                  placeholder="Recipient's Name"
                  className="w-full border-b border-primary/10 bg-transparent py-3 focus:outline-none focus:border-primary transition-colors font-serif text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground font-bold text-primary mb-3">From</label>
                <input 
                  type="text" 
                  value={personalization.senderName || ''}
                  onChange={(e) => updateField('senderName', e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full border-b border-primary/10 bg-transparent py-3 focus:outline-none focus:border-primary transition-colors font-serif text-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground font-bold text-primary mb-3 flex justify-between">
                <span>Personal Note</span>
                <span className="text-foreground/60 font-normal">{personalization.personalMessage?.length || 0}/250</span>
              </label>
              <textarea 
                value={personalization.personalMessage || ''}
                onChange={handleMessageChange}
                placeholder="Write a message to be included on the premium card..."
                rows={4}
                className="w-full border border-primary/10 bg-white p-4 focus:outline-none focus:border-primary transition-colors font-serif text-lg resize-none"
              />
            </div>
          </section>

          {/* Recipient Type */}
          <section>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2 font-bold text-primary">6. Intended For</h2>
            <p className="text-foreground/60 mb-8 font-light italic">Help us optimize the unboxing experience.</p>
            <div className="flex flex-wrap gap-4">
              {RECIPIENT_OPTIONS.map((rec) => (
                <button
                  key={rec.value}
                  onClick={() => updateField('recipient', rec.value)}
                  className={`px-6 py-3 border text-xs font-bold text-primary font-semibold transition-all duration-300 focus:outline-none ${
                    personalization.recipient === rec.value 
                      ? 'border-primary bg-primary text-white' 
                      : 'border-primary/10 bg-white text-foreground/60 hover:border-primary/50'
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </section>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-16 border-t border-primary/10 mt-16 gap-6">
            <Link href="/build">
              <Button variant="outline" className="w-full sm:w-auto px-10 h-14 border-primary text-foreground hover:bg-primary hover:text-white rounded-3xl font-bold text-primary text-xs font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
              </Button>
            </Link>
            <Link href="/review">
              <Button className="w-full sm:w-auto px-12 h-14 bg-primary hover:bg-primary text-white rounded-3xl font-bold text-primary text-xs font-semibold">
                Review & Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
        </div>
      </div>
    </PageTransition>
  );
}
