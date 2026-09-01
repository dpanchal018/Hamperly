'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PreMadeHamper } from '@/types/database.types';
import { HoverCard } from '@/components/ui/AnimatedWrapper';
import { useCart } from '@/contexts/CartContext';
import { Plus, Check, Gift } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getInventoryStatus } from '@/lib/inventory';
import { WishlistButton } from '@/components/customer/WishlistButton';

interface HamperCardProps {
  hamper: PreMadeHamper;
}

export function HamperCard({ hamper }: HamperCardProps) {
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

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'IN STOCK': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'LOW STOCK': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'CRITICAL': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'OUT OF STOCK': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const customerStatus = status === 'CRITICAL' ? 'LOW STOCK' : status;

  return (
    <HoverCard className="w-full h-full">
      <div className={`group flex flex-col h-full bg-white rounded-3xl overflow-hidden transition-all duration-300 relative ${
        isOutOfStock 
          ? 'border border-slate-200 opacity-90'
          : selectedCount > 0 
          ? 'ring-2 ring-primary shadow-lg shadow-primary/20' 
          : 'border border-primary/10 shadow-sm hover:shadow-xl hover:shadow-primary/10'
      }`}>
        
        {/* Out of Stock Ribbon / Selected Badge */}
        {isOutOfStock ? (
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
              Out of Stock
            </span>
          </div>
        ) : selectedCount > 0 ? (
          <div className="absolute top-4 left-4 z-20">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-md">
              <Check className="w-4 h-4" strokeWidth={3} />
            </span>
          </div>
        ) : null}

        {/* Media / Image Container */}
        <Link href={`/hampers/${hamper.slug}`} className="relative aspect-[4/5] overflow-hidden bg-primary/5 flex items-center justify-center">
          <div className="absolute top-3 right-3 z-20 flex">
            <WishlistButton itemId={hamper.id} itemType="HAMPER" className="!relative !top-0 !right-0" />
          </div>
          {hamper.image_url ? (
            <Image 
              src={hamper.image_url} 
              alt={hamper.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                isOutOfStock ? 'grayscale opacity-60' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-primary/30">
              <Gift className="w-12 h-12 mb-2 stroke-[1.5]" />
              <span className="font-script text-2xl">Hamperly Exclusive</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        
        {/* Card Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-primary/70 bg-primary/5 px-3 py-1 rounded-full">
              {hamper.occasion ? hamper.occasion.name : 'Exclusive Collection'}
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(status)}`}>
              {customerStatus}
            </div>
          </div>
          
          <Link href={`/hampers/${hamper.slug}`} className="hover:text-primary transition-colors mb-2">
            <h3 className="font-serif font-bold text-foreground text-xl leading-snug line-clamp-2" title={hamper.name}>
              {hamper.name}
            </h3>
          </Link>
          
          {hamper.description && (
            <p className="text-sm text-foreground/60 line-clamp-2 mb-4">
              {hamper.description}
            </p>
          )}
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-primary/5">
            <div className="text-lg font-bold text-foreground">
              ₹{hamper.selling_price.toFixed(2)}
            </div>
            
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`p-3 rounded-full transition-all ${
                isOutOfStock 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : adding || selectedCount > 0
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'
              }`}
              aria-label={isOutOfStock ? "Out of Stock" : selectedCount > 0 ? "Added to Cart" : "Add to Cart"}
            >
              {adding ? (
                <Check className="w-5 h-5" strokeWidth={2.5} />
              ) : selectedCount > 0 ? (
                <Check className="w-5 h-5" strokeWidth={2.5} />
              ) : (
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </HoverCard>
  );
}
