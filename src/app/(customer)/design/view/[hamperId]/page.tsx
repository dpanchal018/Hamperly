'use client';

import React, { useEffect, useState } from 'react';
import { getLatestDesign, refineHamperPrompt } from '@/actions/designer.actions';
import { useRouter } from 'next/navigation';
import { Sparkles, PackageCheck, Copy, Send, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ViewDesignPage({ params }: { params: Promise<{ hamperId: string }> }) {
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { hamperId } = React.use(params);

  useEffect(() => {
    async function loadDesign() {
      if (hamperId.startsWith('guest_')) {
        const stored = localStorage.getItem(`hamperly_design_${hamperId}`);
        if (stored) {
          setDesign(JSON.parse(stored));
          setLoading(false);
          return;
        }
      }
      
      // If not a guest or local storage missed, try DB
      const { success, design: dbDesign } = await getLatestDesign(hamperId);
      if (success && dbDesign) {
        setDesign(dbDesign);
      } else {
        router.push('/products');
      }
      setLoading(false);
    }
    loadDesign();
  }, [hamperId, router]);

  const handleCopy = async () => {
    if (!design?.prompt_used) return;
    try {
      const textToCopy = `PROMPT:\n${design.prompt_used}\n\nNEGATIVE PROMPT:\n${design.input_metadata?.negative_prompt || ''}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementText.trim()) return;
    
    setRefining(true);
    
    // For guests, we don't have DB persistence for refinements yet, so we block it or handle it.
    // Given the requirements, we should support it by calling the action.
    const result = await refineHamperPrompt(hamperId, refinementText);
    
    if (result.success && result.promptResult) {
      if (hamperId.startsWith('guest_')) {
        // Update local storage
        const stored = JSON.parse(localStorage.getItem(`hamperly_design_${hamperId}`) || '{}');
        stored.prompt_used = result.promptResult.prompt;
        stored.input_metadata = {
          ...stored.input_metadata,
          negative_prompt: result.promptResult.negativePrompt,
          prompt_status: result.promptResult.status,
          warnings: result.promptResult.warnings,
          refinement_request: refinementText
        };
        stored.design_version = (stored.design_version || 1) + 1;
        localStorage.setItem(`hamperly_design_${hamperId}`, JSON.stringify(stored));
        setDesign(stored);
      } else {
        // Reload from DB
        const { design: dbDesign } = await getLatestDesign(hamperId);
        setDesign(dbDesign);
      }
      setRefinementText('');
    } else {
      alert(result.error || 'Failed to refine prompt');
    }
    setRefining(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="text-xl text-slate-500 animate-pulse">Loading design specifications...</p>
      </div>
    );
  }

  if (!design) return null;

  const spec = design.design_specification;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <Sparkles className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Hamper Design Specification
        </h1>
        <p className="text-lg text-slate-600">
          Version {design.design_version} • Generated via AI Designer
        </p>
      </div>

      {design.prompt_used && (
        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-800 mb-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center text-rose-400">
              <Sparkles className="w-6 h-6 mr-3" />
              AI Design Prompt (v{design.design_version || 1})
            </h2>
            <Button 
              onClick={handleCopy}
              variant="outline"
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </Button>
          </div>
          
          {design.input_metadata?.warnings?.length > 0 && (
            <div className="bg-amber-900/50 border border-amber-700/50 rounded-xl p-4 mb-6 flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-amber-500 font-semibold mb-1">Validation Warnings</h4>
                <ul className="text-sm text-amber-200/80 list-disc list-inside">
                  {design.input_metadata.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Positive Prompt</p>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700">
                <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-emerald-400">
                  {design.prompt_used}
                </p>
              </div>
            </div>

            {design.input_metadata?.negative_prompt && (
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Negative Prompt</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/50">
                  <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-rose-300">
                    {design.input_metadata.negative_prompt}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-3 font-medium">Refine Prompt (e.g., "Make it more luxurious" or "Use traditional styles")</p>
            <form onSubmit={handleRefine} className="flex gap-3">
              <input 
                type="text" 
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="How would you like to tweak this prompt?"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                disabled={refining}
              />
              <Button 
                type="submit" 
                disabled={refining || !refinementText.trim()}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-6"
              >
                {refining ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Refine
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-8">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">Configuration</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-slate-500 mb-1 font-medium">Theme</p>
            <p className="font-bold text-lg">{spec.theme}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1 font-medium">Container</p>
            <p className="font-bold text-lg">{spec.container?.type || 'Standard'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1 font-medium">Color Palette</p>
            <p className="font-bold text-lg">{spec.colorPalette}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1 font-medium">Ribbon</p>
            <p className="font-bold text-lg">{spec.ribbon?.style || 'None'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500 mb-1 font-medium">Lighting & Composition</p>
            <p className="font-bold text-lg">{spec.lighting?.style || 'Standard'} • {spec.composition?.style || 'Standard'}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 shadow-inner border border-slate-200 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <PackageCheck className="w-6 h-6 mr-3 text-emerald-600" />
          Product Placements
        </h2>
        
        <div className="space-y-4">
          {spec.products?.map((p: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between">
              <div>
                <span className="font-bold block mb-1">Product ID: {p.productId}</span>
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">Qty: {p.quantity}</span>
                <span className="text-xs font-mono bg-rose-100 text-rose-700 px-2 py-1 rounded ml-2">Priority: {p.visualPriority}</span>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm text-slate-500">Placement</p>
                <p className="font-bold">{p.placement?.position} (Layer {p.placement?.layer})</p>
                <p className="text-sm italic">{p.placement?.orientation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <Link href="/">
          <Button className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg font-bold text-lg">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
