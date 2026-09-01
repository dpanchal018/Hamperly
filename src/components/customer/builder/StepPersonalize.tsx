'use client';

import React from 'react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import { MessageSquare, User, ArrowRight, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StepPersonalize() {
  const { 
    personalMessage, 
    setPersonalMessage, 
    recipient, 
    setRecipient, 
    nextStep, 
    prevStep 
  } = useHamperBuilder();

  const charLimit = 250;
  const charsRemaining = charLimit - personalMessage.length;

  return (
    <div className="space-y-10 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="text-center mb-8">
        <span className="text-rose-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
          Step 04 of 05
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Add Your Personal Touch
        </h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-light">
          We will hand-print your message on your chosen greeting card to accompany the hamper.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Recipient Field */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            Who is this gift for? (Optional)
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. Priya, Rahul, Mom & Dad, Bestie"
            maxLength={100}
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
          />
        </div>

        {/* Personal Message Area */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              Gift Card Message (Optional)
            </label>
            <span className={`text-xs font-semibold ${
              charsRemaining < 20 ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {personalMessage.length} / {charLimit} characters
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={5}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Write a heartfelt note for the recipient. We will print this message inside the hamper..."
              maxLength={charLimit}
              className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 placeholder-slate-400 text-sm leading-relaxed"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-light">
            Tip: Keep it heartfelt and memorable! HTML formatting tags are automatically filtered.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={prevStep}
          className="rounded-full px-8 h-12 text-slate-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customizations
        </Button>

        <Button
          onClick={nextStep}
          className="rounded-full px-10 h-14 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
        >
          <span>Review Complete Hamper</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
