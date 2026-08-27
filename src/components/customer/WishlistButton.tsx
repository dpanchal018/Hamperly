'use client';

import { useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleWishlistItem } from '@/actions/wishlist.actions';
import { useWishlist } from '@/contexts/WishlistContext';
import toast from 'react-hot-toast';

interface WishlistButtonProps {
  itemId: string;
  itemType: 'HAMPER' | 'PRODUCT';
  className?: string;
}

export function WishlistButton({ itemId, itemType, className = '' }: WishlistButtonProps) {
  const { wishlistedHampers, wishlistedProducts, toggleLocalState, isLoaded } = useWishlist();
  const [isPending, startTransition] = useTransition();

  const isWishlisted = itemType === 'HAMPER' 
    ? wishlistedHampers.has(itemId) 
    : wishlistedProducts.has(itemId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    // Optimistic update
    toggleLocalState(itemId, itemType);

    startTransition(async () => {
      const res = await toggleWishlistItem(itemId, itemType);
      if (res.error) {
        // Revert on error
        toggleLocalState(itemId, itemType);
        toast.error(res.error);
      } else {
        if (res.isWishlisted) {
          toast.success('Saved to wishlist \u2764\uFE0F', { icon: '\u2764\uFE0F' });
        }
      }
    });
  };

  if (!isLoaded) return null; // Prevent hydration mismatch flash

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-slate-100 hover:scale-110 transition-transform z-20 ${className}`}
      aria-label="Toggle Wishlist"
    >
      <Heart 
        className={`w-5 h-5 transition-colors duration-300 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-400'}`} 
      />
    </button>
  );
}
