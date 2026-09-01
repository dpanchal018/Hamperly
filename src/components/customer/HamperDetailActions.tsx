'use client';

import { useState, useEffect, useRef } from 'react';
import { PreMadeHamper } from '@/types/database.types';
import { useCart } from '@/contexts/CartContext';
import { Plus, Check } from 'lucide-react';
import { WishlistButton } from '@/components/customer/WishlistButton';

interface HamperDetailActionsProps {
  hamper: PreMadeHamper;
}

export function HamperDetailActions({ hamper }: HamperDetailActionsProps) {
  const { items, addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const selectedItem = items.find((i) => i.id === hamper.id && i.itemType === 'HAMPER');
  const selectedCount = selectedItem ? selectedItem.quantity : 0;

  const handleAdd = () => {
    setAdding(true);
    addItem({
      id: hamper.id,
      name: hamper.name,
      price: hamper.selling_price,
      imageUrl: hamper.image_url,
      maxQuantity: hamper.stock_quantity,
      itemType: 'HAMPER',
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdding(false), 500);
  };

  return (
    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
      <button
        onClick={handleAdd}
        className={`flex items-center justify-center flex-1 sm:flex-initial px-8 py-3.5 rounded-full font-semibold transition-all ${
          adding || selectedCount > 0
            ? 'bg-primary text-white shadow-md'
            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
        }`}
      >
        {adding ? (
          <><Check className="w-5 h-5 mr-2" strokeWidth={2.5} /> Added</>
        ) : selectedCount > 0 ? (
          <><Plus className="w-5 h-5 mr-2" strokeWidth={2.5} /> Add Another ({selectedCount} in cart)</>
        ) : (
          <><Plus className="w-5 h-5 mr-2" strokeWidth={2.5} /> Add to Cart</>
        )}
      </button>

      <div className="flex items-center">
        <WishlistButton 
          itemId={hamper.id} 
          itemType="HAMPER" 
          className="!relative !top-0 !right-0 !p-3.5 border-primary/20 hover:border-primary/40 shadow-sm" 
        />
      </div>
    </div>
  );
}
