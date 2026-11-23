'use client';

import { Heart, Home, LayoutGrid, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useStorefront } from '@/contexts/StorefrontContext';

// App-style bottom navigation for phones; the centre button opens the hamper studio.
export function MobileTabBar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { goTo, openStudio, openAccount } = useStorefront();
  const tab = 'flex flex-col items-center gap-1 text-[11px] text-ink-muted font-semibold active:text-rose';

  return (
    <nav
      aria-label="Shortcuts"
      className="md:hidden fixed left-3 right-3 bottom-3 z-40 h-[68px] rounded-[26px] bg-white/92 backdrop-blur-xl shadow-[0_14px_34px_-16px_rgba(58,18,48,.45)] border border-plum/5 grid grid-cols-5 items-center print:hidden"
    >
      <button type="button" onClick={() => goTo('top')} className={tab}>
        <Home className="w-[22px] h-[22px]" />Home
      </button>
      <button type="button" onClick={() => goTo('shop')} className={tab}>
        <LayoutGrid className="w-[22px] h-[22px]" />Shop
      </button>
      <button
        type="button"
        onClick={() => openStudio()}
        aria-label="Build a hamper"
        className="justify-self-center -mt-8 w-[60px] h-[60px] rounded-[22px] bg-rose grid place-items-center text-white shadow-[0_12px_24px_-10px_rgba(184,61,114,.8)]"
      >
        <Plus className="w-7 h-7" strokeWidth={2.4} />
      </button>
      <button type="button" onClick={() => openAccount('wishlist')} className={tab}>
        <Heart className="w-[22px] h-[22px]" />Wishlist
      </button>
      <button type="button" onClick={() => setIsCartOpen(true)} className={`${tab} relative`} aria-label={`Bag, ${totalItems} item${totalItems === 1 ? '' : 's'}`}>
        <ShoppingBag className="w-[22px] h-[22px]" />Bag
        {totalItems > 0 && (
          <span className="absolute -top-1 right-[calc(50%-20px)] min-w-[18px] h-[18px] px-1 rounded-full bg-plum text-white text-[11px] grid place-items-center">{totalItems}</span>
        )}
      </button>
    </nav>
  );
}
