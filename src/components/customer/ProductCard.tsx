'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PublicProduct } from '@/services/catalog.service';
import { useSelection } from '@/contexts/SelectionContext';
import { Plus, Minus, Check } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';
import { WishlistButton } from '@/components/customer/WishlistButton';
import { HoverCard } from '@/components/ui/AnimatedWrapper';

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, removeItem, items } = useSelection();
  
  const status = getInventoryStatus(product.stock_quantity);
  const isOutOfStock = status === 'OUT OF STOCK';
  const selectedItem = items.find(i => i.product.id === product.id);
  const selectedCount = selectedItem ? selectedItem.quantity : 0;
  
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
    <HoverCard className="h-full w-full">
      <div className={`group flex flex-col h-full relative transition-all duration-300 rounded-3xl overflow-hidden bg-white ${
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
        
        <Link href={`/products/${product.slug}`} className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary/5 to-transparent flex items-center justify-center">
          <div className="absolute top-3 right-3 z-20 flex">
            <WishlistButton itemId={product.id} itemType="PRODUCT" className="!relative !top-0 !right-0" />
          </div>
          {product.primary_image_url ? (
            <Image 
              src={product.primary_image_url} 
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-sm ${
                isOutOfStock ? 'grayscale opacity-60' : ''
              }`}
            />
          ) : (
            <div className="text-primary/30 text-sm font-script text-2xl">Hamperly</div>
          )}
        </Link>
        
        <div className="p-6 flex flex-col flex-1 bg-white">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-primary/70 bg-primary/5 px-3 py-1 rounded-full">
              {product.category?.name || 'Item'}
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(status)}`}>
              {customerStatus}
            </div>
          </div>
          
          <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors mb-2">
            <h3 className="font-serif font-bold text-foreground text-xl leading-snug line-clamp-2" title={product.name}>
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-auto flex items-center justify-between pt-4">
            <div className="text-lg font-bold text-foreground">
              ₹{product.selling_price.toFixed(2)}
            </div>
            
            {isOutOfStock ? (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                Unavailable
              </div>
            ) : selectedCount > 0 ? (
              <div className="flex items-center space-x-2 bg-primary/5 rounded-full px-2 py-1 border border-primary/10">
                <button 
                  onClick={() => selectedCount === 1 ? removeItem(product.id) : updateQuantity(product.id, selectedCount - 1)}
                  aria-label="Decrease quantity"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
                >
                  <Minus className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="text-sm font-bold w-6 text-center text-foreground">{selectedCount}</span>
                <button 
                  onClick={() => updateQuantity(product.id, selectedCount + 1)}
                  disabled={selectedCount >= product.stock_quantity}
                  aria-label="Increase quantity"
                  className={`w-7 h-7 flex items-center justify-center rounded-full bg-white text-primary shadow-sm transition-colors ${selectedCount >= product.stock_quantity ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-white'}`}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addItem(product)}
                aria-label="Add to selection"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-xs hover:shadow-md"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </HoverCard>
  );
}
