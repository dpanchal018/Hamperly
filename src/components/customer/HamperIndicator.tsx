'use client';

import Link from 'next/link';
import { Gift } from 'lucide-react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';

/**
 * Sitewide "hamper in progress" indicator. HamperBuilderContext persists its
 * draft to localStorage but is otherwise invisible outside /build — this
 * surfaces it everywhere so customers don't lose track of what they're
 * building while browsing the rest of the site.
 */
export function HamperIndicator() {
  const { totalProductsCount, totalPrice, isInitialized } = useHamperBuilder();
  // isInitialized is false until the localStorage draft has been read client-side
  // (same hydration-guard pattern used elsewhere, e.g. HamperStudio.tsx) — treat
  // as "empty" until then so the first client render matches the server render.
  const hasItems = isInitialized && totalProductsCount > 0;

  return (
    <Link
      href="/build"
      aria-label={hasItems ? `Your hamper: ${totalProductsCount} items, finish it` : 'Start building a hamper'}
      className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full border transition-colors text-xs ${
        hasItems
          ? 'bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 font-bold'
          : 'text-foreground/70 hover:text-primary border-primary/10 font-semibold'
      }`}
    >
      <Gift className="w-4 h-4" strokeWidth={1.5} />
      <span>
        {hasItems
          ? `${totalProductsCount} item${totalProductsCount !== 1 ? 's' : ''} · ₹${totalPrice.toFixed(0)}`
          : 'Start a Hamper'}
      </span>
    </Link>
  );
}
