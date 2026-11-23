'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Gift, Mail, RotateCcw, Star, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useStorefront } from '@/contexts/StorefrontContext';
import { getHamperQuickView, type HamperQuickViewData } from '@/actions/quickview.actions';
import { HamperDetailActions } from '@/components/customer/HamperDetailActions';
import { HamperCard } from '@/components/customer/HamperCard';
import { ReviewCard } from '@/components/customer/ReviewCard';
import { ReviewForm } from '@/components/customer/ReviewForm';
import { StarRating } from '@/components/customer/StarRating';
import { WhatsAppIcon } from '@/components/customer/SocialIcons';
import { getInventoryStatus } from '@/lib/inventory';
import type { PublicHamper } from '@/types/database.types';

type LoadState = { id: string; data: HamperQuickViewData | null } | null;

/** Hamper details as an overlay on the single page (replaces the old /hampers/[id] page). */
export function HamperQuickView({ hampers, whatsAppNumber }: { hampers: PublicHamper[]; whatsAppNumber: string }) {
  const { quickViewId, closeHamper, openAuth } = useStorefront();
  const [loaded, setLoaded] = useState<LoadState>(null);

  useEffect(() => {
    if (!quickViewId) return;
    let cancelled = false;
    getHamperQuickView(quickViewId).then(data => {
      if (!cancelled) setLoaded({ id: quickViewId, data });
    });
    return () => { cancelled = true; };
  }, [quickViewId]);

  const current = loaded && loaded.id === quickViewId ? loaded : null;
  const data = current?.data ?? null;
  const notFound = current !== null && data === null;
  const hamper = data?.hamper;

  const reviews = data?.reviews ?? [];
  const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const status = hamper ? getInventoryStatus(hamper.stock_quantity) : 'IN STOCK';
  const inside = (hamper?.items || []).filter(i => i.product);
  const related = hamper
    ? hampers
        .filter(h => h.id !== hamper.id && (h.stock_quantity === null || h.stock_quantity > 0))
        .sort((a, b) => Number(b.occasion_id === hamper.occasion_id) - Number(a.occasion_id === hamper.occasion_id))
        .slice(0, 3)
    : [];

  return (
    <Dialog open={!!quickViewId} onOpenChange={open => { if (!open) closeHamper(); }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-6xl w-full max-w-[calc(100%-1rem)] max-h-[94vh] overflow-y-auto p-0 rounded-[32px] bg-blush ring-0 gap-0"
      >
        <div className="sticky top-0 z-20 flex justify-end p-3 pointer-events-none">
          <button type="button" onClick={closeHamper} aria-label="Close" className="pointer-events-auto w-11 h-11 rounded-full bg-white shadow grid place-items-center text-plum hover:bg-petal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hamper ? (
          <div className="px-6 pb-12 -mt-4 min-h-[50vh] grid place-items-center text-center">
            <DialogTitle className="sr-only">Hamper details</DialogTitle>
            {notFound ? (
              <div>
                <p className="font-serif text-2xl text-plum mb-2">This hamper isn&apos;t available</p>
                <DialogDescription className="text-ink-muted">It may have been retired. Have a look at the others in the shop.</DialogDescription>
              </div>
            ) : (
              <DialogDescription className="flex items-center gap-3 text-ink-muted font-semibold">
                <span className="w-6 h-6 rounded-full border-[3px] border-petal border-t-rose animate-spin" aria-hidden="true" /> Opening hamper…
              </DialogDescription>
            )}
          </div>
        ) : (
          <div className="px-5 sm:px-10 pb-10 -mt-6">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
              <div className="relative aspect-square rounded-[28px] overflow-hidden bg-[#EAF1FB] grid place-items-center lg:sticky lg:top-16">
                {status !== 'OUT OF STOCK' && hamper.stock_quantity !== null && hamper.stock_quantity <= 5 && (
                  <span className="absolute left-4 top-4 z-10 bg-[#FFF1D6] text-[#7A4A00] text-xs font-bold px-3 py-1.5 rounded-full">Only {hamper.stock_quantity} left</span>
                )}
                {status === 'OUT OF STOCK' && (
                  <span className="absolute left-4 top-4 z-10 bg-[#EEE6EA] text-ink-muted text-xs font-bold px-3 py-1.5 rounded-full">Sold out</span>
                )}
                {hamper.image_url ? (
                  <Image src={hamper.image_url} alt={hamper.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <svg viewBox="0 0 260 220" className="w-3/5 h-auto hp-float" aria-hidden="true">
                    <rect x="40" y="88" width="180" height="116" rx="10" fill="#FFFFFF" stroke="#3A1230" strokeWidth="4" />
                    <rect x="28" y="66" width="204" height="30" rx="8" fill="#F2A7BD" stroke="#3A1230" strokeWidth="4" />
                    <rect x="120" y="66" width="20" height="138" fill="#B83D72" />
                    <path d="M130 66c-26-34-58-10-34 6 10 7 26 0 34-6zM130 66c26-34 58-10 34 6-10 7-26 0-34-6z" fill="#B83D72" stroke="#3A1230" strokeWidth="4" />
                    <text x="180" y="160" textAnchor="middle" fontFamily="var(--font-dancing), cursive" fontSize="24" fill="#3A1230">Hamperly</text>
                  </svg>
                )}
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hamper.occasion && (
                      <span className="text-xs font-bold tracking-[0.1em] text-rose bg-[#FBEAF0] px-2.5 py-1.5 rounded-full">{hamper.occasion.name.toUpperCase()}</span>
                    )}
                    {status !== 'OUT OF STOCK' && <span className="text-xs font-bold text-[#1F6B3E] bg-[#E7F6EC] px-2.5 py-1.5 rounded-full">In stock · ready to pack</span>}
                  </div>
                  <DialogTitle className="font-serif font-semibold text-plum text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.03]">{hamper.name}</DialogTitle>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2.5 mt-3">
                      <StarRating value={Math.round(averageRating)} readOnly size="sm" />
                      <a href="#hamper-reviews" className="text-sm text-ink-muted hover:text-rose">{averageRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}</a>
                    </div>
                  )}
                  <div className="flex items-baseline gap-3 mt-4">
                    <span className="text-3xl font-bold text-ink">₹{hamper.selling_price.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-ink-muted">Inclusive of taxes · free shipping</span>
                  </div>
                </div>

                <DialogDescription className="text-[17px] leading-relaxed text-[#5E4453]">{hamper.description || 'A beautifully curated hamper, hand-packed in our Vadodara studio.'}</DialogDescription>

                {inside.length > 0 && (
                  <div className="bg-white border border-petal-line rounded-3xl p-5">
                    <h3 className="text-[13px] font-bold tracking-[0.12em] text-rose mb-3.5">WHAT&apos;S INSIDE</h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {inside.map(item => {
                        const img = item.product.primary_image_url?.[0]?.image_url;
                        return (
                          <li key={item.id} className="flex items-center gap-3 font-semibold text-ink">
                            <span className="relative w-11 h-11 rounded-xl bg-petal overflow-hidden shrink-0 grid place-items-center">
                              {img ? <Image src={img} alt="" fill sizes="44px" className="object-cover" /> : <Gift className="w-5 h-5 text-rose" />}
                            </span>
                            <span className="leading-snug">{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span>
                          </li>
                        );
                      })}
                      <li className="flex items-center gap-3 font-semibold text-ink">
                        <span className="w-11 h-11 rounded-xl bg-[#FFFDF8] border border-petal-line grid place-items-center shrink-0"><Mail className="w-5 h-5 text-rose" /></span>
                        Handwritten message card
                      </li>
                    </ul>
                  </div>
                )}

                <HamperDetailActions hamper={hamper} whatsAppNumber={whatsAppNumber} />

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#5E4453]">
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-rose" />Hand-packed in Vadodara</span>
                  <span className="flex items-center gap-1.5"><WhatsAppIcon className="w-4 h-4 text-[#1E9E55]" />Pay on WhatsApp after ordering</span>
                  <span className="flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-rose" />Easy cancellation</span>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <section className="mt-14">
                <h3 className="font-serif font-semibold text-plum text-3xl tracking-[-0.02em] mb-5">Goes well with</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {related.map(h => <HamperCard key={h.id} hamper={h} />)}
                </div>
              </section>
            )}

            <section id="hamper-reviews" className="mt-14 scroll-mt-16">
              <h3 className="font-serif font-semibold text-plum text-3xl tracking-[-0.02em] mb-5">Ratings &amp; reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-ink-muted mb-6">No reviews yet. Be the first to share how it went!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                </div>
              )}
              <div className="max-w-xl">
                {!data.isLoggedIn ? (
                  <button type="button" onClick={() => openAuth('login')} className="h-12 px-6 bg-plum hover:bg-plum-soft text-white font-bold rounded-full">
                    Sign in to write a review
                  </button>
                ) : data.myReviewStatus ? (
                  <div className="bg-white border border-petal-line rounded-3xl p-6 text-center font-semibold text-plum">
                    {data.myReviewStatus === 'PENDING' && 'Your review is pending approval.'}
                    {data.myReviewStatus === 'APPROVED' && 'Thanks for your review!'}
                    {data.myReviewStatus === 'REJECTED' && 'Your review was not approved for publishing.'}
                  </div>
                ) : (
                  <ReviewForm hamperId={hamper.id} />
                )}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

