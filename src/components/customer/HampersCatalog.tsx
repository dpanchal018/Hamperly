'use client';

import { useMemo, useState } from 'react';
import { PublicHamper, Gender, RecipientTag, Occasion } from '@/types/database.types';
import { HamperCard } from '@/components/customer/HamperCard';
import { Search, X, Gift, SlidersHorizontal } from 'lucide-react';
import { EMPTY_FILTER, useStorefront } from '@/contexts/StorefrontContext';

interface HampersCatalogProps {
  initialHampers: PublicHamper[];
  genders?: Gender[];
  recipientTags?: RecipientTag[];
  occasions?: Occasion[];
  events?: { id: string; name: string }[];
  /** Pre-made hamper name -> completed sales, for the Bestseller badge */
  salesCount?: Record<string, number>;
}

const POPULAR_KEYWORDS = ['Coffee', 'Dry Fruits', 'Diwali', 'Kids', 'Pink', 'Boys', 'Girls', 'Snacks'];

const PRICE_RANGES = [
  { id: 'under_1000', label: 'Under ₹1,000' },
  { id: '1000_2500', label: '₹1,000–2,500' },
  { id: '2500_5000', label: '₹2,500–5,000' },
  { id: 'above_5000', label: '₹5,000+' },
];

const selectClass = 'w-full h-11 bg-white border-[1.5px] border-[#E5C2CF] rounded-2xl px-3 text-sm font-semibold text-plum focus:outline-none focus:border-rose';

/** The shop section: search, chips and filters over all ready-made hampers, all in-page. */
export function HampersCatalog({ initialHampers, genders = [], recipientTags = [], occasions = [], events = [], salesCount = {} }: HampersCatalogProps) {
  const { shopFilter: f, setShopFilter, openStudio } = useStorefront();
  const [showFilters, setShowFilters] = useState(false);

  const filteredHampers = useMemo(() => {
    let results = initialHampers;
    if (f.gender) results = results.filter(h => h.gender_id?.toString() === f.gender);
    if (f.occasion) {
      const valid = [f.occasion, ...occasions.filter(o => o.parent_id?.toString() === f.occasion).map(o => o.id.toString())];
      results = results.filter(h => valid.includes(h.occasion_id?.toString() ?? ''));
    }
    if (f.event) results = results.filter(h => h.event_id?.toString() === f.event);
    if (f.recipient) results = results.filter(h => (h.hamper_recipient_tags || []).some(t => t.recipient_tag_id?.toString() === f.recipient));
    if (f.priceRange) {
      results = results.filter(h => {
        const price = h.selling_price || 0;
        if (f.priceRange === 'under_1000') return price < 1000;
        if (f.priceRange === '1000_2500') return price >= 1000 && price <= 2500;
        if (f.priceRange === '2500_5000') return price > 2500 && price <= 5000;
        if (f.priceRange === 'above_5000') return price > 5000;
        return true;
      });
    }
    const tokens = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length) {
      results = results.filter(h => {
        const text = `${h.name || ''} ${h.description || ''}`.toLowerCase();
        return tokens.every(t => text.includes(t));
      });
    }
    // In stock first, then bestsellers, then newest
    return [...results].sort((a, b) => {
      const soldOut = (h: PublicHamper) => (h.stock_quantity !== null && h.stock_quantity <= 0 ? 1 : 0);
      return soldOut(a) - soldOut(b) || (salesCount[b.name] || 0) - (salesCount[a.name] || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [initialHampers, f, occasions, salesCount]);

  const activeCount = (['occasion', 'event', 'recipient', 'gender', 'priceRange'] as const).filter(k => f[k]).length + (f.q ? 1 : 0);
  const occasionName = occasions.find(o => o.id === f.occasion)?.name;
  const eventName = events.find(e => e.id === f.event)?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* Search + chips */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1 flex items-center bg-white rounded-full border-[1.5px] border-[#E5C2CF] focus-within:border-rose transition-colors pl-5 pr-1.5 h-14">
          <Search className="w-5 h-5 text-ink-muted shrink-0" />
          <input
            type="search"
            value={f.q}
            onChange={e => setShopFilter({ q: e.target.value })}
            placeholder="Search hampers by name or what's inside…"
            aria-label="Search hampers"
            className="w-full bg-transparent px-3 text-[15px] text-ink placeholder:text-ink-muted/80 focus:outline-none"
          />
          {f.q && (
            <button type="button" onClick={() => setShopFilter({ q: '' })} aria-label="Clear search" className="w-11 h-11 grid place-items-center rounded-full text-ink-muted hover:bg-blush">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(s => !s)}
          aria-expanded={showFilters}
          className="h-14 px-5 rounded-full bg-white border-[1.5px] border-[#E5C2CF] text-plum font-bold flex items-center justify-center gap-2 hover:border-plum transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {POPULAR_KEYWORDS.map(keyword => {
          const on = f.q.toLowerCase() === keyword.toLowerCase();
          return (
            <button
              key={keyword}
              type="button"
              aria-pressed={on}
              onClick={() => setShopFilter({ q: on ? '' : keyword })}
              className={`h-10 px-4 rounded-full text-sm font-semibold shrink-0 border-[1.5px] transition-colors ${on ? 'bg-plum border-plum text-white' : 'bg-white border-[#E5C2CF] text-plum hover:border-plum'}`}
            >
              {keyword}
            </button>
          );
        })}
      </div>

      {showFilters && (
        <div className="bg-white rounded-[28px] border border-petal-line p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-bold tracking-[0.08em] text-rose">OCCASION
            <select className={selectClass} value={f.occasion} onChange={e => setShopFilter({ occasion: e.target.value, event: '' })}>
              <option value="">Any occasion</option>
              {occasions.filter(o => !o.parent_id).map(parent => (
                <optgroup key={parent.id} label={parent.name}>
                  <option value={parent.id}>All {parent.name}</option>
                  {occasions.filter(c => c.parent_id === parent.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold tracking-[0.08em] text-rose">RECIPIENT
            <select className={selectClass} value={f.recipient} onChange={e => setShopFilter({ recipient: e.target.value })}>
              <option value="">Anyone</option>
              {recipientTags.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold tracking-[0.08em] text-rose">FOR
            <select className={selectClass} value={f.gender} onChange={e => setShopFilter({ gender: e.target.value })}>
              <option value="">Everyone</option>
              {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold tracking-[0.08em] text-rose">BUDGET
            <select className={selectClass} value={f.priceRange} onChange={e => setShopFilter({ priceRange: e.target.value })}>
              <option value="">Any price</option>
              {PRICE_RANGES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <span>Showing <strong className="text-ink">{filteredHampers.length}</strong> {filteredHampers.length === 1 ? 'hamper' : 'hampers'}</span>
        {occasionName && <FilterPill label={occasionName} onClear={() => setShopFilter({ occasion: '' })} />}
        {eventName && <FilterPill label={eventName} onClear={() => setShopFilter({ event: '' })} />}
        {activeCount > 0 && (
          <button type="button" onClick={() => setShopFilter(EMPTY_FILTER, { replace: true })} className="ml-1 font-bold text-rose hover:text-rose-deep">
            Clear all
          </button>
        )}
      </div>

      {filteredHampers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredHampers.map(hamper => (
            <HamperCard key={hamper.id} hamper={hamper} badge={(salesCount[hamper.name] || 0) > 0 ? 'Bestseller' : undefined} />
          ))}
        </div>
      ) : (
        <div className="text-center py-14 px-6 bg-white rounded-[28px] border border-petal-line max-w-xl mx-auto w-full">
          <div className="w-16 h-16 bg-petal rounded-full grid place-items-center mx-auto text-rose mb-4">
            <Gift className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-serif font-semibold text-plum">
            {occasionName ? `No ready ${occasionName.toLowerCase()} yet` : 'No matching hampers'}
          </h3>
          <p className="text-ink-muted mt-2 mb-6">
            {occasionName ? 'Build one in the studio. We\'ll start you with gifts picked for this occasion.' : 'Try a different search, clear a filter, or build exactly what you want in the studio.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {occasionName && (
              <button
                type="button"
                onClick={() => openStudio({ occasion: occasions.find(o => o.id === f.occasion)?.slug || f.occasion })}
                className="h-11 px-6 rounded-full bg-rose text-white font-bold hover:bg-rose-deep"
              >
                Build a {occasionName.toLowerCase().replace(/ hampers?$/, '')} hamper
              </button>
            )}
            <button type="button" onClick={() => setShopFilter(EMPTY_FILTER, { replace: true })} className="h-11 px-6 rounded-full bg-plum text-white font-bold hover:bg-plum-soft">
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-petal text-plum font-semibold">
      {label}
      <button type="button" onClick={onClear} aria-label={`Remove ${label} filter`} className="w-7 h-7 grid place-items-center rounded-full hover:bg-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
