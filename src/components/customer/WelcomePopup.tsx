'use client';

import { useEffect, useState } from 'react';
import { useStorefront } from '@/contexts/StorefrontContext';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const STORAGE_KEY = 'hamperly_welcome_seen_v1';

function hasSeen() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return true; }
}

function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* storage blocked */ }
}

/** First-visit welcome on the home page: pick an occasion and jump straight to its hampers. */
export function WelcomePopup({ occasions }: { occasions: { id: string; name: string; slug: string }[] }) {
  const { setShopFilter } = useStorefront();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(occasions[0]?.slug ?? null);

  useEffect(() => {
    if (occasions.length === 0 || hasSeen()) return;
    // After the curtain intro has opened
    const timer = setTimeout(() => setOpen(true), 5200);
    return () => clearTimeout(timer);
  }, [occasions.length]);

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) markSeen();
  };

  const pickedOccasion = occasions.find(o => o.slug === picked);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[28px] gap-0 bg-white ring-0 shadow-[0_30px_60px_-30px_rgba(58,18,48,.55)]">
        <div className="h-36 bg-rose grid place-items-center">
          <span className="font-script text-5xl text-white">Hamperly</span>
        </div>
        <div className="p-6 pt-5">
          <DialogTitle className="font-serif text-3xl font-semibold text-plum">
            Let&apos;s make someone&apos;s <span className="italic text-rose">day.</span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 mb-4 text-ink-muted text-[15px] leading-relaxed">
            Pick an occasion and we&apos;ll show the hampers made for it. Every hamper comes with a free handwritten card.
          </DialogDescription>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5" role="group" aria-label="Occasion">
            {occasions.slice(0, 6).map(o => (
              <button
                key={o.id}
                type="button"
                aria-pressed={picked === o.slug}
                onClick={() => setPicked(o.slug)}
                className={`min-h-11 px-2 py-2 rounded-2xl border-[1.5px] text-sm font-semibold leading-tight transition-colors ${
                  picked === o.slug ? 'bg-plum border-plum text-white' : 'bg-white border-[#E5C2CF] text-plum hover:border-plum'
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={!pickedOccasion}
              onClick={() => { close(false); if (pickedOccasion) setShopFilter({ occasion: pickedOccasion.id }, { replace: true, scroll: true }); }}
              className="flex-1 min-w-40 h-12 rounded-full bg-rose hover:bg-rose-deep text-white font-bold transition-colors"
            >
              Show {pickedOccasion ? pickedOccasion.name.toLowerCase() : 'hampers'}
            </button>
            <button type="button" onClick={() => close(false)} className="h-12 px-5 rounded-full border-[1.5px] border-[#E5C2CF] text-plum font-bold hover:border-plum transition-colors">
              Just browsing
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
