'use client';

import { useStorefront } from '@/contexts/StorefrontContext';
import Image from 'next/image';
import { PreMadeHamper } from '@/types/database.types';
import { HoverCard } from '@/components/ui/AnimatedWrapper';
import { useCart } from '@/contexts/CartContext';
import { Plus, Check } from 'lucide-react';
import { useState, useEffect, useRef, ViewTransition } from 'react';
import { getInventoryStatus } from '@/lib/inventory';
import { WishlistButton } from '@/components/customer/WishlistButton';
import { useWishlist } from '@/contexts/WishlistContext';
import { toggleWishlistItem } from '@/actions/wishlist.actions';
import toast from 'react-hot-toast';

interface HamperCardProps {
  hamper: PreMadeHamper;
  /** Optional highlight such as "Bestseller"; stock badges take priority. */
  badge?: string;
}

// Soft backdrops for hampers without a photo, picked per hamper so the grid isn't uniform
const PLACEHOLDER_TINTS = [
  { bg: '#EAF1FB', lid: '#7FB3F0' },
  { bg: '#FBEAF0', lid: '#F2A7BD' },
  { bg: '#FFF6E6', lid: '#E8C27A' },
  { bg: '#F1F6E6', lid: '#B9D47A' },
  { bg: '#F3ECFA', lid: '#C9B6E4' },
];

function tintFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TINTS[h % PLACEHOLDER_TINTS.length];
}

export function HamperCard({ hamper, badge }: HamperCardProps) {
  const { items, addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  const status = getInventoryStatus(hamper.stock_quantity);
  const isOutOfStock = status === 'OUT OF STOCK';
  const selectedItem = items.find(i => i.id === hamper.id && i.itemType === 'HAMPER');
  const selectedCount = selectedItem ? selectedItem.quantity : 0;
  
  const { wishlistedHampers, toggleLocalState } = useWishlist();
  const { openHamper } = useStorefront();
  // Real link (shareable, opens in a new tab) that opens the in-page details overlay on click
  const detailsHref = `/?hamper=${hamper.id}`;
  const openDetails = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openHamper(hamper.id);
  };
  const watching = wishlistedHampers.has(hamper.id);

  // Sold out: saving to the wishlist subscribes the shopper to a back-in-stock notification
  const handleNotify = async () => {
    if (watching) {
      toast.success("You're on the list. We'll notify you when it's back.");
      return;
    }
    toggleLocalState(hamper.id, 'HAMPER');
    const res = await toggleWishlistItem(hamper.id, 'HAMPER');
    if (res?.error) {
      toggleLocalState(hamper.id, 'HAMPER');
      toast.error(/logged in/i.test(res.error) ? 'Sign in to get notified when it’s back in stock.' : res.error);
    } else {
      toast.success("We'll notify you when it's back in stock", { icon: '🔔' });
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    setAdding(true);
    addItem({
      id: hamper.id,
      name: hamper.name,
      price: hamper.selling_price,
      imageUrl: hamper.image_url,
      maxQuantity: hamper.stock_quantity,
      itemType: 'HAMPER'
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdding(false), 500);
  };

  const lowStockLeft = !isOutOfStock && hamper.stock_quantity !== null && hamper.stock_quantity <= 5 ? hamper.stock_quantity : null;
  const pill = isOutOfStock
    ? { text: 'Sold out', cls: 'bg-[#EEE6EA] text-ink-muted' }
    : lowStockLeft !== null
    ? { text: `Only ${lowStockLeft} left`, cls: 'bg-[#FFF1D6] text-[#7A4A00]' }
    : badge
    ? { text: badge, cls: 'bg-plum text-white' }
    : null;
  const tint = tintFor(hamper.id);

  return (
    <HoverCard className="w-full h-full">
      <article className={`group flex flex-col h-full bg-white rounded-[28px] overflow-hidden border transition-shadow duration-300 ${
        selectedCount > 0 ? 'border-rose ring-2 ring-rose/30' : 'border-petal-line hover:shadow-[0_24px_48px_-20px_rgba(58,18,48,.35)]'
      }`}>
        {/* Media */}
        <a href={detailsHref} onClick={openDetails} aria-label={`View ${hamper.name}`} className="relative aspect-[4/4] overflow-hidden grid place-items-center" style={{ background: tint.bg }}>
          {pill && (
            <span className={`absolute left-3.5 top-3.5 z-20 text-xs font-bold px-2.5 py-1.5 rounded-full tracking-wide ${pill.cls}`}>{pill.text}</span>
          )}
          <div className="absolute top-3 right-3 z-20 flex">
            <WishlistButton itemId={hamper.id} itemType="HAMPER" className="!relative !top-0 !right-0" />
          </div>
          {hamper.image_url ? (
            <ViewTransition name={`hamper-${hamper.id}`} share="hp-morph" default="none">
              <Image
                src={hamper.image_url}
                alt={hamper.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
              />
            </ViewTransition>
          ) : (
            <svg viewBox="0 0 200 160" className="w-1/2 h-auto transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[-2deg]" aria-hidden="true">
              <rect x="36" y="64" width="128" height="80" rx="8" fill="#FFFFFF" stroke="#3A1230" strokeWidth="3" />
              <rect x="28" y="50" width="144" height="22" rx="6" fill={tint.lid} stroke="#3A1230" strokeWidth="3" />
              <rect x="92" y="50" width="16" height="94" fill={tint.lid} />
              <path d="M100 50c-20-26-44-8-26 4 8 5 20 0 26-4zM100 50c20-26 44-8 26 4-8 5-20 0-26-4z" fill={tint.lid} stroke="#3A1230" strokeWidth="3" />
              <text x="100" y="114" textAnchor="middle" fontFamily="var(--font-dancing), cursive" fontSize="18" fill="#3A1230">Hamperly</text>
            </svg>
          )}
          {hamper.description && (
            <div className="absolute left-3 right-3 bottom-3 rounded-2xl bg-white/95 px-3.5 py-3 text-[13px] text-ink opacity-0 translate-y-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none">
              <div className="text-[11px] font-bold tracking-[0.12em] text-rose mb-1">WHAT&apos;S INSIDE</div>
              <p className="line-clamp-2">{hamper.description}</p>
            </div>
          )}
        </a>

        {/* Content */}
        <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
          <a href={detailsHref} onClick={openDetails} className="hover:text-rose transition-colors">
            <h3 className="font-serif font-semibold text-plum text-[22px] leading-snug line-clamp-2" title={hamper.name}>
              {hamper.name}
            </h3>
          </a>

          <div className="mt-auto pt-4 flex items-center justify-between gap-3">
            <div className="text-xl font-bold text-ink">₹{hamper.selling_price.toLocaleString('en-IN')}</div>
            <button
              onClick={isOutOfStock ? handleNotify : handleAdd}
              className={`h-11 px-4 shrink-0 whitespace-nowrap rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors ${
                isOutOfStock
                  ? 'bg-plum text-white hover:bg-plum-soft'
                  : adding || selectedCount > 0
                  ? 'bg-plum text-white'
                  : 'bg-rose text-white hover:bg-rose-deep'
              }`}
              aria-label={isOutOfStock ? `Notify me when ${hamper.name} is back in stock` : selectedCount > 0 ? `Add another ${hamper.name}` : `Add ${hamper.name} to bag`}
            >
              {adding || selectedCount > 0 ? <Check className="w-4 h-4" strokeWidth={2.5} /> : !isOutOfStock && <Plus className="w-4 h-4" strokeWidth={2.5} />}
              {isOutOfStock ? (watching ? 'Notifying you' : 'Notify me') : selectedCount > 0 ? `In bag · ${selectedCount}` : 'Add to bag'}
            </button>
          </div>
        </div>
      </article>
    </HoverCard>
  );
}
