'use client';

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

  const isWishlisted = itemType === 'HAMPER' 
    ? wishlistedHampers.has(itemId) 
    : wishlistedProducts.has(itemId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    // Instant optimistic update (0ms feedback)
    toggleLocalState(itemId, itemType);

    try {
      const res = await toggleWishlistItem(itemId, itemType);
      if (res?.error) {
        // Revert on error
        toggleLocalState(itemId, itemType);
        toast.error(res.error);
      } else if (res?.isWishlisted) {
        toast.success('Saved to wishlist ❤️', { icon: '❤️' });
      }
    } catch {
      // Revert on unexpected network failure
      toggleLocalState(itemId, itemType);
      toast.error('Unable to update wishlist. Please try again.');
    }
  };

  if (!isLoaded) return null; // Prevent hydration mismatch flash

  return (
    <button
      onClick={handleToggle}
      className={`absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-slate-100 hover:scale-110 active:scale-95 transition-transform z-20 ${className}`}
      aria-label="Toggle Wishlist"
    >
      <Heart 
        className={`w-5 h-5 transition-colors duration-300 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-400'}`} 
      />
    </button>
  );
}
