'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStorefront } from '@/contexts/StorefrontContext';

interface FinderHamper {
  selling_price: number;
  hamper_recipient_tags?: { recipient_tag_id: number | string }[] | null;
}

// Same buckets the /hampers catalog filters on (priceRange query param)
const BUDGETS = [
  { id: 'under_1000', label: 'Under ₹1,000', test: (p: number) => p < 1000 },
  { id: '1000_2500', label: '₹1,000–2,500', test: (p: number) => p >= 1000 && p <= 2500 },
  { id: '2500_5000', label: '₹2,500–5,000', test: (p: number) => p > 2500 && p <= 5000 },
  { id: 'above_5000', label: '₹5,000+', test: (p: number) => p > 5000 },
];

export function GiftFinder({ recipients, hampers }: { recipients: { id: number | string; name: string }[]; hampers: FinderHamper[] }) {
  const [recipient, setRecipient] = useState<string>('');
  const [budget, setBudget] = useState<string>('');

  // Show the recipients that actually have hampers, most-stocked first; the rest go in "More"
  const { top, more } = useMemo(() => {
    const counts = new Map<string, number>();
    hampers.forEach(h => (h.hamper_recipient_tags || []).forEach(t => counts.set(String(t.recipient_tag_id), (counts.get(String(t.recipient_tag_id)) || 0) + 1)));
    const used = recipients.filter(r => counts.has(String(r.id))).sort((a, b) => (counts.get(String(b.id)) || 0) - (counts.get(String(a.id)) || 0));
    return { top: used.slice(0, 7), more: used.slice(7) };
  }, [hampers, recipients]);

  const matches = useMemo(() => {
    const b = BUDGETS.find(x => x.id === budget);
    return hampers.filter(h => {
      if (recipient && !(h.hamper_recipient_tags || []).some(t => String(t.recipient_tag_id) === recipient)) return false;
      if (b && !b.test(h.selling_price || 0)) return false;
      return true;
    }).length;
  }, [hampers, recipient, budget]);

  const { setShopFilter } = useStorefront();

  const chip = (on: boolean) =>
    `h-11 px-4 rounded-full border-[1.5px] text-[15px] font-semibold transition-colors ${
      on ? 'bg-plum border-plum text-white' : 'bg-white border-[#E5C2CF] text-plum hover:border-plum'
    }`;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-petal-line flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex-[1_1_220px]">
          <div className="text-[13px] font-bold tracking-[0.12em] text-rose">GIFT FINDER · 10 SECONDS</div>
          <h2 className="font-serif font-semibold text-3xl text-plum mt-2">Who are you gifting?</h2>
        </div>
        <div className="flex-[999_1_480px] flex flex-wrap gap-2.5" role="group" aria-label="Recipient">
          <button type="button" aria-pressed={recipient === ''} onClick={() => setRecipient('')} className={chip(recipient === '')}>Anyone</button>
          {top.map(r => (
            <button key={r.id} type="button" aria-pressed={recipient === String(r.id)} onClick={() => setRecipient(String(r.id))} className={chip(recipient === String(r.id))}>
              {r.name}
            </button>
          ))}
          {more.length > 0 && (
            <select
              aria-label="More recipients"
              value={more.some(r => String(r.id) === recipient) ? recipient : ''}
              onChange={e => setRecipient(e.target.value)}
              className={`${chip(more.some(r => String(r.id) === recipient))} pr-8 appearance-auto`}
            >
              <option value="">More…</option>
              {more.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 pt-5 border-t border-dashed border-[#E5C2CF]">
        <span className="font-bold text-plum mr-2">Budget</span>
        {BUDGETS.map(b => (
          <button key={b.id} type="button" aria-pressed={budget === b.id} onClick={() => setBudget(budget === b.id ? '' : b.id)} className={chip(budget === b.id)}>
            {b.label}
          </button>
        ))}
        <button type="button" onClick={() => setShopFilter({ recipient, priceRange: budget }, { replace: true, scroll: true })} className="ml-auto h-12 px-5 rounded-full bg-plum text-white font-bold inline-flex items-center gap-2 hover:bg-plum-soft transition-colors">
          {matches > 0 ? `Show ${matches} matching hamper${matches === 1 ? '' : 's'}` : 'Browse all hampers'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
