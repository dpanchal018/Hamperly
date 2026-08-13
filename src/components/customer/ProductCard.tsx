'use client';

import Link from 'next/link';
import { PublicProduct } from '@/services/catalog.service';
import { useSelection } from '@/contexts/SelectionContext';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingBag } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';
import { HoverCard } from '@/components/ui/AnimatedWrapper';

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useSelection();
  
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
      <div className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full relative shadow-sm">
        {selectedCount > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-md">
            <ShoppingBag className="w-3 h-3 mr-1" />
            {selectedCount} Selected
          </div>
        )}
        
        <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-slate-50 flex items-center justify-center">
          {product.primary_image_url ? (
            <img 
              src={product.primary_image_url} 
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-slate-300">No image</div>
          )}
        </Link>
        
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {product.category?.name || 'Uncategorized'}
            </div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
              {customerStatus}
            </div>
          </div>
          
          <Link href={`/products/${product.slug}`} className="hover:text-rose-600 transition-colors">
            <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
          </Link>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="font-bold text-lg text-slate-900">
              ₹{product.selling_price.toFixed(2)}
            </div>
            <Button 
              size="sm" 
              onClick={() => addItem(product)}
              disabled={isOutOfStock || (selectedCount >= product.stock_quantity)}
              className={selectedCount > 0 ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </HoverCard>
  );
}
