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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBasket className="w-16 h-16 text-slate-300 mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Hamper is Empty</h1>
        <p className="text-slate-500 mb-8 max-w-md">Please add some products to your hamper before personalizing it.</p>
        <Link href="/products">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-8 h-12">
            Browse Products
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
      className={`relative p-4 rounded-xl text-left border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
        selected 
          ? 'border-rose-500 bg-rose-50 shadow-sm' 
          : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-slate-50'
      } ${className}`}
    >
      {selected && (
        <div className="absolute top-3 right-3 bg-rose-500 text-white rounded-full p-0.5">
          <Check className="w-4 h-4" />
        </div>
      )}
      {children}
    </button>
  );

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Personalize Your Hamper
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Make it uniquely yours. Choose the perfect style, packaging, and add a heartfelt message.
          </p>
        </div>

        <div className="space-y-12 bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100">
          
          {/* Theme Selection */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">1. Choose a Theme</h2>
            <p className="text-slate-500 mb-6">Set the overall mood and style of your gift.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map((theme) => (
                <OptionButton
                  key={theme.value}
                  selected={personalization.theme === theme.value}
                  onClick={() => updateField('theme', theme.value)}
                >
                  <h3 className="font-bold text-slate-900 mb-1">{theme.label}</h3>
                  <p className="text-sm text-slate-500">{theme.description}</p>
                </OptionButton>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Color Palette Selection */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">2. Color Palette</h2>
            <p className="text-slate-500 mb-6">Select the primary accent color for the decorations.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {COLOR_PALETTES.map((color) => (
                <OptionButton
                  key={color.value}
                  selected={personalization.colorPalette === color.value}
                  onClick={() => updateField('colorPalette', color.value)}
                  className="flex items-center space-x-3"
                >
                  <div 
                    className="w-8 h-8 rounded-full border border-slate-200 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-bold text-slate-900">{color.label}</span>
                </OptionButton>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Packaging Selection */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">3. Packaging</h2>
            <p className="text-slate-500 mb-6">How would you like your items presented?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PACKAGING_OPTIONS.map((pack) => (
                <OptionButton
                  key={pack.value}
                  selected={personalization.packaging === pack.value}
                  onClick={() => updateField('packaging', pack.value)}
                  className="flex items-center space-x-4 p-5"
                >
                  <div className={`p-3 rounded-xl ${personalization.packaging === pack.value ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {pack.icon === 'Box' && <Box className="w-6 h-6" />}
                    {pack.icon === 'ShoppingBasket' && <ShoppingBasket className="w-6 h-6" />}
                    {pack.icon === 'Layout' && <Layout className="w-6 h-6" />}
                    {pack.icon === 'Package' && <Package className="w-6 h-6" />}
                  </div>
                  <span className="font-bold text-slate-900 text-lg">{pack.label}</span>
                </OptionButton>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Ribbon Selection */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">4. Finishing Touch</h2>
            <p className="text-slate-500 mb-6">Choose a ribbon to tie it all together.</p>
            <div className="flex flex-wrap gap-3">
              {RIBBON_OPTIONS.map((ribbon) => (
                <button
                  key={ribbon.value}
                  onClick={() => updateField('ribbon', ribbon.value)}
                  className={`flex items-center px-4 py-3 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    personalization.ribbon === ribbon.value
                      ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mr-2 border border-slate-300 ${ribbon.colorClass} ${ribbon.value === 'none' && 'border-dashed'}`} />
                  {ribbon.label}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Recipient & Message */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">5. Personal Message</h2>
            <p className="text-slate-500 mb-6">Who is this for and what would you like to say?</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">This gift is for my...</label>
                <select
                  value={personalization.recipient}
                  onChange={(e) => updateField('recipient', e.target.value as any)}
                  className="w-full md:w-64 p-3 border-2 border-slate-200 rounded-xl focus:border-rose-500 focus:ring-0 outline-none text-slate-900 font-medium bg-white"
                >
                  {RECIPIENT_OPTIONS.map((rec) => (
                    <option key={rec.value} value={rec.value}>{rec.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-bold text-slate-700">Gift Message (Optional)</label>
                  <span className={`text-xs font-bold ${personalization.personalMessage.length >= 250 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {personalization.personalMessage.length} / 250
                  </span>
                </div>
                <textarea
                  value={personalization.personalMessage}
                  onChange={handleMessageChange}
                  placeholder="Type a heartfelt message here..."
                  className="w-full h-32 p-4 border-2 border-slate-200 rounded-xl focus:border-rose-500 focus:ring-0 outline-none text-slate-900 resize-none"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Action Bar */}
        <div className="mt-10 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
          <Link 
            href="/build" 
            className={buttonVariants({ variant: 'outline', className: "w-full sm:w-auto h-14 px-8 text-slate-600 border-slate-300 rounded-xl font-bold hover:bg-slate-50" })}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Hamper
          </Link>
          
          <Link 
            href="/review" 
            className={buttonVariants({ className: "w-full sm:w-auto h-14 px-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold text-lg" })}
          >
            Review Personalization <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

      </div>
    </PageTransition>
  );
}
