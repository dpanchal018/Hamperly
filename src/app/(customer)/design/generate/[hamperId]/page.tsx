'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generateHamperDesign, getLatestDesign } from '@/actions/designer.actions';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GenerateDesignPage() {
  const params = useParams();
  const hamperId = params.hamperId as string;
  const router = useRouter();
  
  const [status, setStatus] = useState<'INITIALIZING' | 'GENERATING' | 'GENERATING_IMAGE' | 'COMPLETED' | 'WARNING' | 'FAILED'>('INITIALIZING');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function triggerGeneration() {
      setStatus('GENERATING');
      
      try {
        const payloadStr = localStorage.getItem('hamperly_handoff_payload');
        if (!payloadStr) {
          throw new Error("No hamper data found.");
        }
        
        const payload = JSON.parse(payloadStr);

        const result = await generateHamperDesign(payload);
        
        if (result.success) {
          if (result.design) {
            localStorage.setItem(`hamperly_design_${hamperId}`, JSON.stringify({ design_version: 1, design_specification: result.design }));
          }

          if (result.status === 'WARNING') {
            setWarnings(result.warnings || []);
            setStatus('WARNING');
          } else {
            setStatus('GENERATING_IMAGE');
            // Phase 7: Trigger Prompt Generation
            const { generateHamperPrompt } = await import('@/actions/designer.actions');
            const imgResult = await generateHamperPrompt(hamperId, result.design);
            
            if (imgResult.success && imgResult.promptResult) {
              // Save prompt to localStorage for guests so they can see it in View Design
              if (hamperId.startsWith('guest_')) {
                const stored = JSON.parse(localStorage.getItem(`hamperly_design_${hamperId}`) || '{}');
                stored.prompt_used = imgResult.promptResult.prompt;
                stored.input_metadata = {
                  ...stored.input_metadata,
                  negative_prompt: imgResult.promptResult.negativePrompt,
                  prompt_status: imgResult.promptResult.status,
                  warnings: imgResult.promptResult.warnings,
                };
                localStorage.setItem(`hamperly_design_${hamperId}`, JSON.stringify(stored));
              }
            }

            setStatus('COMPLETED');
          }
        } else {
          setError(result.error || 'Unknown error occurred.');
          setStatus('FAILED');
        }
      } catch (err) {
        setError('An unexpected error occurred during design generation.');
        setStatus('FAILED');
      }
    }
    
    // For now, let's just simulate the call until we fix the action
    triggerGeneration();
  }, [hamperId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center min-h-[70vh] flex flex-col justify-center items-center">
      
      {(status === 'GENERATING' || status === 'GENERATING_IMAGE') && (
        <div className="space-y-6">
          <Loader2 className="w-16 h-16 text-rose-500 animate-spin mx-auto" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {status === 'GENERATING' ? 'Designing your hamper...' : 'Generating Prompt...'}
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-lg">
            {status === 'GENERATING' 
              ? 'Our AI Designer is arranging your selected products to create the perfect presentation. This may take a few moments.'
              : 'Our Visualizer Agent is crafting a high-definition prompt for your mockup.'}
          </p>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="space-y-6">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Design Complete!
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-lg">
            Your hamper's physical arrangement has been expertly designed.
          </p>
          <div className="pt-6">
            <Link href={`/design/view/${hamperId}`}>
              <Button className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg font-bold text-lg">
                View Design Specs
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'WARNING' && (
        <div className="space-y-6">
          <AlertCircle className="w-20 h-20 text-amber-500 mx-auto" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Design Needs Attention
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-lg">
            We generated a design, but encountered some physical constraints.
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-left max-w-md mx-auto">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </div>
          <div className="pt-6">
            <Link href={`/design/view/${hamperId}`}>
              <Button className="h-14 px-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg font-bold text-lg">
                View Design Anyway
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'FAILED' && (
        <div className="space-y-6">
          <AlertCircle className="w-20 h-20 text-rose-500 mx-auto" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Generation Failed
          </h1>
          <p className="text-rose-600 max-w-md mx-auto">
            {error || 'We couldn\'t prepare the hamper design right now. Please try again.'}
          </p>
          <div className="pt-6">
            <Button 
              variant="outline" 
              className="h-12 px-8 border-slate-300 text-slate-700 font-bold"
              onClick={() => { hasTriggered.current = false; setStatus('INITIALIZING'); }}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
