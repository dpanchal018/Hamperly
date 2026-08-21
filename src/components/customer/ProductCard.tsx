'use client';

import Link from 'next/link';
import { PublicProduct } from '@/services/catalog.service';
import { useSelection } from '@/contexts/SelectionContext';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';
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
      case 'IN STOCK': return 'bg-emerald-100 text-emerald-800';
      case 'LOW STOCK': return 'bg-amber-100 text-amber-800';
      case 'CRITICAL': return 'bg-orange-100 text-orange-800';
      case 'OUT OF STOCK': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // Convert status to customer-facing format if needed (e.g., hiding CRITICAL from customers, mapping it to Low Stock)
  const customerStatus = status === 'CRITICAL' ? 'LOW STOCK' : status;

  return (
    <HoverCard>
      <div className="group bg-card border border-border rounded-3xl overflow-hidden flex flex-col h-full relative shadow-sm">
        {selectedCount > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-md">
            <ShoppingBag className="w-3 h-3 mr-1" />
            {selectedCount} Selected
          </div>
        )}
        
        <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-secondary flex items-center justify-center">
          {product.primary_image_url ? (
            <img 
              src={product.primary_image_url} 
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground">No image</div>
          )}
        </Link>
        
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {product.category?.name || 'Uncategorized'}
            </div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
              {customerStatus}
            </div>
          </div>
          
          <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold font-serif text-foreground text-lg leading-tight line-clamp-2" title={product.name}>
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-auto pt-4 flex items-center justify-end">
            {selectedCount > 0 ? (
              <div className="flex items-center space-x-3 bg-secondary border border-border rounded-full px-2 py-1">
                <button 
                  onClick={() => selectedCount === 1 ? removeItem(product.id) : updateQuantity(product.id, selectedCount - 1)}
                  className="w-7 h-7 flex items-center justify-center text-primary hover:bg-background rounded-full transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-4 text-center text-primary">{selectedCount}</span>
                <button 
                  onClick={() => updateQuantity(product.id, selectedCount + 1)}
                  disabled={selectedCount >= product.stock_quantity}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${selectedCount >= product.stock_quantity ? 'opacity-50' : 'text-primary hover:bg-background'}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button 
                size="sm" 
                onClick={() => addItem(product)}
                disabled={isOutOfStock}
                className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-4 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </HoverCard>
  );
}
