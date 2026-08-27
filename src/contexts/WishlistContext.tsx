"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserWishlistIds } from '@/actions/wishlist.actions';
import { usePathname } from 'next/navigation';

interface WishlistContextType {
  wishlistedHampers: Set<string>;
  wishlistedProducts: Set<string>;
  toggleLocalState: (id: string, type: 'HAMPER' | 'PRODUCT') => void;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistedHampers: new Set(),
  wishlistedProducts: new Set(),
  toggleLocalState: () => {},
  isLoaded: false
});

export function WishlistProvider({ children, userId }: { children: React.ReactNode, userId?: string }) {
  const [wishlistedHampers, setWishlistedHampers] = useState<Set<string>>(new Set());
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!userId || userId === 'guest') {
      setWishlistedHampers(new Set());
      setWishlistedProducts(new Set());
      setIsLoaded(true);
      return;
    }

    async function load() {
      const res = await getUserWishlistIds();
      setWishlistedHampers(res.hampers);
      setWishlistedProducts(res.products);
      setIsLoaded(true);
    }
    load();
  }, [userId, pathname]); // Re-fetch on nav in case it updated

  const toggleLocalState = (id: string, type: 'HAMPER' | 'PRODUCT') => {
    if (type === 'HAMPER') {
      setWishlistedHampers(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setWishlistedProducts(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistedHampers, wishlistedProducts, toggleLocalState, isLoaded }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
