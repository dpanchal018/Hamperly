'use client';

import { Button } from '@/components/ui/button';
import { Gift, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function HamperCard({ hamper }: { hamper: any }) {
  const { items, addItem, updateQuantity } = useCart();
  
  const existingItem = items.find(item => item.id === hamper.id);
  const quantity = existingItem ? existingItem.quantity : 0;

  const handleAddToCart = () => {
    addItem({
      id: hamper.id,
      name: hamper.name,
      price: hamper.selling_price,
      imageUrl: hamper.image_url,
      maxQuantity: hamper.stock_quantity
    });
  };

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
        {hamper.image_url ? (
          <img 
            src={hamper.image_url} 
            alt={hamper.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary">
            <Gift className="w-12 h-12 opacity-20" />
          </div>
        )}
        {hamper.stock_quantity <= 0 && (
          <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold shadow-md">
            Sold Out
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-2xl font-bold font-serif text-foreground mb-2">{hamper.name}</h3>
        {hamper.description && (
          <p className="text-muted-foreground text-sm mb-6 line-clamp-2">{hamper.description}</p>
        )}
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
          <span className="text-2xl font-bold text-foreground">₹{hamper.selling_price.toFixed(2)}</span>
          
          {quantity > 0 ? (
            <div className="flex items-center border border-slate-200 rounded-full bg-white shadow-sm overflow-hidden h-10">
              <button 
                onClick={() => updateQuantity(hamper.id, quantity - 1)}
                className="w-10 h-full flex items-center justify-center hover:bg-rose-50 text-slate-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-slate-900">
                {quantity}
              </span>
              <button 
                onClick={() => updateQuantity(hamper.id, quantity + 1)}
                className="w-10 h-full flex items-center justify-center hover:bg-rose-50 text-slate-600 transition-colors disabled:opacity-50"
                disabled={quantity >= hamper.stock_quantity}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button 
              disabled={hamper.stock_quantity <= 0}
              onClick={handleAddToCart}
              className="rounded-full px-6 bg-primary text-primary-foreground hover:opacity-90 h-10"
            >
              {hamper.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
