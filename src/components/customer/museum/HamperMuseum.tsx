'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type JSX } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Hand, Landmark, Pause, Play, ShoppingBag, Star } from 'lucide-react';
import { supportsWebGL } from '../studio/hamperScene';
import { MuseumScene } from './museumScene';
import type { MuseumExhibit } from './types';

export type { MuseumExhibit } from './types';

interface HamperMuseumProps {
  exhibits: MuseumExhibit[];
  onAddToBag: (exhibit: MuseumExhibit) => void;
  onViewDetails: (hamperId: string) => void;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2';

function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null || stock > 5) return null;
  if (stock <= 0) return <span className="inline-flex items-center rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink">Sold out</span>;
  return <span className="inline-flex items-center rounded-full bg-rose/10 px-3 py-1 text-xs font-bold text-rose">Only {stock} left</span>;
}

function Stars({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size} ${rating >= i - 0.25 ? 'fill-gold text-gold' : 'text-gold/40'}`} />
      ))}
    </span>
  );
}

/** The museum label for one exhibit: all real DOM text so screen readers can read it */
function Placard({ exhibit, index, total, onAddToBag, onViewDetails, compact = false }: {
  exhibit: MuseumExhibit; index: number; total: number; compact?: boolean;
} & Omit<HamperMuseumProps, 'exhibits'>) {
  const soldOut = exhibit.stock !== null && exhibit.stock <= 0;
  const quotes = exhibit.reviews.slice(0, 2);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-rose">Exhibit {index + 1} of {total}</p>
        {exhibit.occasionName && <p className="font-script text-xl text-plum-soft mt-1">{exhibit.occasionName}</p>}
        <h3 className="font-serif text-2xl lg:text-[28px] leading-tight text-plum mt-1">{exhibit.name}</h3>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xl font-bold text-ink">{inr.format(exhibit.price)}</span>
        <StockBadge stock={exhibit.stock} />
      </div>

      {exhibit.rating !== null && exhibit.reviewCount > 0 && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Stars rating={exhibit.rating} />
          <span className="sr-only">Rated {exhibit.rating.toFixed(1)} out of 5,</span>
          <span aria-hidden="true" className="font-semibold text-ink">{exhibit.rating.toFixed(1)}</span>
          <span>({exhibit.reviewCount} review{exhibit.reviewCount === 1 ? '' : 's'})</span>
        </p>
      )}

      {exhibit.description && <p className="text-sm text-ink-muted leading-relaxed line-clamp-3">{exhibit.description}</p>}

      {exhibit.items.length > 0 && (
        <div>
          <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-plum mb-2">What&apos;s inside</p>
          <ul className={`text-sm text-ink space-y-1 ${compact ? 'max-h-28' : 'max-h-40'} overflow-y-auto pr-1`}>
            {exhibit.items.map(it => (
              <li key={it.productId} className="flex items-baseline gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 translate-y-[-2px]" aria-hidden="true" />
                <span className="min-w-0">{it.name}</span>
                {it.quantity > 1 && <span className="text-ink-muted font-semibold shrink-0">× {it.quantity}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && quotes.length > 0 && (
        <div className="space-y-3">
          {quotes.map(r => (
            <figure key={r.id} className="rounded-2xl bg-blush border border-petal-line px-4 py-3">
              <blockquote className="text-sm text-ink italic line-clamp-3">&ldquo;{r.comment}&rdquo;</blockquote>
              <figcaption className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-ink-muted">
                <Stars rating={r.rating} size="w-3 h-3" />
                <span className="sr-only">{r.rating} out of 5 stars,</span>
                <span>{r.author}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => onAddToBag(exhibit)}
          aria-label={soldOut ? `${exhibit.name} is sold out` : `Add ${exhibit.name} to bag`}
          className={`h-12 px-6 rounded-full bg-rose hover:bg-rose-deep disabled:bg-ink/20 disabled:text-ink-muted disabled:cursor-not-allowed text-white text-sm font-bold inline-flex items-center gap-2 transition-colors ${focusRing}`}
        >
          <ShoppingBag className="w-4 h-4" aria-hidden="true" /> {soldOut ? 'Sold out' : 'Add to bag'}
        </button>
        <button
          type="button"
          onClick={() => onViewDetails(exhibit.id)}
          aria-label={`View details of ${exhibit.name}`}
          className={`h-12 px-6 rounded-full border-2 border-plum text-plum hover:bg-plum hover:text-white text-sm font-bold transition-colors ${focusRing}`}
        >
          View details
        </button>
      </div>
    </div>
  );
}

/** Non-3D fallback: a horizontal gallery of exhibit cards */
function MuseumFallback({ exhibits, onAddToBag, onViewDetails }: HamperMuseumProps) {
  return (
    <div className="rounded-[28px] bg-petal p-4 sm:p-6">
      <p className="text-sm text-ink-muted mb-4 px-1">Scroll through the collection. Each exhibit is one of our ready-made hampers.</p>
      <ul className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3" aria-label="Museum exhibits">
        {exhibits.map((ex, i) => (
          <li key={ex.id} className="snap-start shrink-0 w-[85%] sm:w-[360px] rounded-[28px] bg-white border border-petal-line overflow-hidden">
            {ex.imageUrl && (
              <div className="relative aspect-[4/3] bg-blush">
                <Image src={ex.imageUrl} alt={ex.name} fill sizes="(max-width: 640px) 85vw, 360px" className="object-cover" />
              </div>
            )}
            <div className="p-5">
              <Placard exhibit={ex} index={i} total={exhibits.length} onAddToBag={onAddToBag} onViewDetails={onViewDetails} compact />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The Hamperly Museum: a 3D gallery hall where every ready-made hamper is an exhibit
 * on a lit plinth. Guided tour, prev/next, drag to look around, tap an exhibit to visit it.
 */
export default function HamperMuseum({ exhibits, onAddToBag, onViewDetails }: HamperMuseumProps): JSX.Element | null {
  const sceneRef = useRef<MuseumScene | null>(null);
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const [focus, setFocus] = useState<number | null>(null);
  const [guided, setGuided] = useState(false);
  const [hintSeen, setHintSeen] = useState(false);
  const total = exhibits.length;

  const attachCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    try {
      sceneRef.current = new MuseumScene(canvas, exhibits, {
        onFocusChange: i => setFocus(i),
        onInteract: () => setHintSeen(true),
      });
      setFocus(null);
      setGuided(false);
    } catch (err) {
      console.error('Hamperly Museum 3D failed to start', err);
      setFailed(true);
      return;
    }
    return () => { sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [exhibits]);

  const go = (index: number | null) => {
    setFocus(index);
    sceneRef.current?.setFocus(index);
  };
  const next = () => go(focus === null ? 0 : (focus + 1) % total);
  const prev = () => go(focus === null ? total - 1 : (focus - 1 + total) % total);
  const toggleGuided = () => {
    const on = !guided;
    setGuided(on);
    sceneRef.current?.setGuided(on);
    if (on && focus === null) go(0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Escape' || e.key === 'Home') { e.preventDefault(); go(null); }
  };

  if (total === 0) return null;
  if (failed) return <MuseumFallback exhibits={exhibits} onAddToBag={onAddToBag} onViewDetails={onViewDetails} />;

  const current = focus !== null && focus < total ? exhibits[focus] : null;
  const ctrl = `h-11 rounded-full bg-white/90 hover:bg-white text-plum text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors ${focusRing}`;

  return (
    <div className="rounded-[28px] overflow-hidden bg-plum-deep border border-petal-line lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col">
        <div
          tabIndex={0}
          role="group"
          aria-roledescription="3D museum"
          aria-label="Museum hall. Use the left and right arrow keys to walk between exhibits, Escape for the overview."
          onKeyDown={onKeyDown}
          className={`relative h-[380px] sm:h-[480px] lg:h-[620px] ${focusRing} focus-visible:ring-offset-0 focus-visible:ring-inset`}
        >
          <canvas
            ref={attachCanvas}
            role="img"
            aria-label={`A 3D museum hall with ${total} ready-made hampers on lit plinths.${current ? ` Now viewing exhibit ${(focus ?? 0) + 1}: ${current.name}.` : ' Viewing the entrance.'} Drag to look around, tap an exhibit to walk to it.`}
            className="absolute inset-0 w-full h-full block touch-none"
          />

          {!hintSeen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex items-center gap-2 bg-plum/90 text-white rounded-full px-4 py-2 text-xs sm:text-sm font-semibold pointer-events-none whitespace-nowrap">
              <Hand className="w-4 h-4 text-[#F2A7BD]" aria-hidden="true" /> Drag to look around · tap a hamper to visit
            </div>
          )}

          <div className="absolute inset-x-3 sm:inset-x-4 bottom-3 sm:bottom-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={prev} aria-label="Previous exhibit" className={`${ctrl} w-11`}>
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={next} aria-label="Next exhibit" className={`${ctrl} w-11`}>
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(null)} aria-label="Overview of the whole hall" aria-pressed={focus === null} className={`${ctrl} px-3.5`}>
                <Landmark className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">Overview</span>
              </button>
            </div>
            <button
              type="button"
              onClick={toggleGuided}
              aria-pressed={guided}
              className={`h-11 px-4 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors ${focusRing} ${guided ? 'bg-plum text-white hover:bg-plum-soft' : 'bg-rose text-white hover:bg-rose-deep'}`}
            >
              {guided ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              {guided ? 'Pause tour' : <>Start <span className="hidden sm:inline">guided</span> tour</>}
            </button>
          </div>
        </div>

        <nav aria-label="Jump to an exhibit" className="bg-plum-deep px-3 py-2.5">
          <ul className="flex gap-2 overflow-x-auto">
            {exhibits.map((ex, i) => (
              <li key={ex.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to exhibit ${i + 1}: ${ex.name}`}
                  aria-current={focus === i ? 'true' : undefined}
                  className={`relative w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${focus === i ? 'ring-2 ring-gold bg-rose text-white' : 'bg-plum-soft text-white/80 hover:text-white'}`}
                >
                  {ex.imageUrl ? (
                    <>
                      <Image src={ex.imageUrl} alt="" fill sizes="44px" className={`object-cover ${focus === i ? '' : 'opacity-70'}`} />
                      <span className="relative bg-plum/70 rounded-full px-1.5 leading-5">{i + 1}</span>
                    </>
                  ) : i + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <aside aria-label="Exhibit placard" className="bg-white p-6 lg:p-7 lg:h-[688px] lg:overflow-y-auto">
        <p className="sr-only" aria-live="polite">{current ? `Exhibit ${(focus ?? 0) + 1} of ${total}: ${current.name}` : 'Museum overview'}</p>
        <div>
          {current ? (
            <Placard exhibit={current} index={focus ?? 0} total={total} onAddToBag={onAddToBag} onViewDetails={onViewDetails} />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-rose">Now entering</p>
              <h3 className="font-serif text-2xl lg:text-[28px] leading-tight text-plum">
                {total} hand-curated hamper{total === 1 ? '' : 's'}, <span className="font-script text-rose">on display</span>
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Stroll the hall to see what&apos;s inside each of our ready-made hampers, read what other gifters said, and add your favourite straight to your bag.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={() => go(0)} className={`h-12 px-6 rounded-full bg-rose hover:bg-rose-deep text-white text-sm font-bold transition-colors ${focusRing}`}>
                  Visit exhibit 1
                </button>
                <button type="button" onClick={() => { if (!guided) toggleGuided(); }} className={`h-12 px-6 rounded-full border-2 border-plum text-plum hover:bg-plum hover:text-white text-sm font-bold transition-colors ${focusRing}`}>
                  Start guided tour
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
