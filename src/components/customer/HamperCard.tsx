'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PreMadeHamper } from '@/types/database.types';
import { HoverCard } from '@/components/ui/AnimatedWrapper';
import { useCart } from '@/contexts/CartContext';
import { Plus, Check, Gift } from 'lucide-react';
import { useState } from 'react';
import { getInventoryStatus } from '@/lib/inventory';

interface HamperCardProps {
  hamper: PreMadeHamper;
}

export function HamperCard({ hamper }: HamperCardProps) {
  const { items, addItem } = useCart();
  const [adding, setAdding] = useState(false);
  
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
    setTimeout(() => setAdding(false), 500);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'IN STOCK': return 'bg-green-100 text-green-700';
      case 'LOW STOCK': return 'bg-amber-100 text-amber-700';
      case 'CRITICAL': return 'bg-orange-100 text-orange-700';
      case 'OUT OF STOCK': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const customerStatus = status === 'CRITICAL' ? 'LOW STOCK' : status;

  return (
    <HoverCard className="w-full h-full">
      <div className={`group flex flex-col h-full bg-white rounded-3xl overflow-hidden transition-all duration-300 ${selectedCount > 0 ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'border border-primary/10 shadow-sm hover:shadow-xl hover:shadow-primary/10'}`}>
        
        {/* Selected Badge */}
        {selectedCount > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-md">
              <Check className="w-4 h-4" strokeWidth={3} />
            </span>
          </div>
        )}

        <Link href={`/hampers/${hamper.id}`} className="relative aspect-[4/3] overflow-hidden bg-primary/5 flex items-center justify-center">
          {hamper.image_url ? (
            <Image 
              src={hamper.image_url} 
              alt={hamper.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
            />
          ) : (
            <div className={`flex flex-col items-center justify-center text-primary/30 ${isOutOfStock ? 'opacity-50' : ''}`}>
              <Gift className="w-12 h-12 mb-2" strokeWidth={1.5} />
              <span className="font-script text-2xl">Curated Hamper</span>
            </div>
          )}
          {isOutOfStock && (
             <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
               <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg transform -rotate-12 border-2 border-white">
                 OUT OF STOCK
               </span>
             </div>
          )}
        </Link>
        
        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-primary/70 bg-primary/5 px-3 py-1 rounded-full">
              Hamper
            </div>
            {hamper.stock_quantity !== null && (
              <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                {customerStatus}
              </div>
            )}
          </div>
          <Link href={`/hampers/${hamper.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-serif font-bold text-foreground text-2xl mb-2 line-clamp-2" title={hamper.name}>
              {hamper.name}
            </h3>
          </Link>
          
          <p className="text-foreground/70 font-light text-sm line-clamp-2 mb-4 flex-1">
            {hamper.description || "A beautifully curated selection."}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <div className={`text-xl font-bold ${isOutOfStock ? 'text-slate-400' : 'text-foreground'}`}>
              ₹{hamper.selling_price.toFixed(2)}
            </div>
            
            <button
              onClick={handleAdd}
              disabled={isOutOfStock || adding}
              className={`flex items-center justify-center px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : adding || selectedCount > 0
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
              }`}
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : adding ? (
                <><Check className="w-4 h-4 mr-1" strokeWidth={2.5} /> Added</>
              ) : selectedCount > 0 ? (
                <><Plus className="w-4 h-4 mr-1" strokeWidth={2.5} /> Add Another</>
              ) : (
                <><Plus className="w-4 h-4 mr-1" strokeWidth={2.5} /> Add to Cart</>
              )}
            </button>
          </div>
        </div>
      </div>
    </HoverCard>
  );
}
