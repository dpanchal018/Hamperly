'use client';

import { useState } from 'react';
import { useSelection } from '@/contexts/SelectionContext';
import { PublicProduct } from '@/services/catalog.service';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';

interface Props {
  product: PublicProduct;
}

export function ProductDetailActions({ product }: Props) {
  const { items, addItem, updateQuantity } = useSelection();
  const [adding, setAdding] = useState(false);
  
  const status = getInventoryStatus(product.stock_quantity);
  const isOutOfStock = status === 'OUT OF STOCK';
  
  const selectedItem = items.find(i => i.product.id === product.id);
  const currentQuantity = selectedItem ? selectedItem.quantity : 0;
  
  const handleAdd = () => {
    if (isOutOfStock) return;
    setAdding(true);
    addItem(product);
    setTimeout(() => setAdding(false), 500);
  };
  
  const handleIncrease = () => {
    updateQuantity(product.id, currentQuantity + 1);
  };
  
  const handleDecrease = () => {
    updateQuantity(product.id, currentQuantity - 1);
  };

  if (isOutOfStock) {
    return (
      <Button size="lg" className="w-full sm:w-auto h-14 px-12 text-sm tracking-[0.2em] uppercase bg-primary/5 text-foreground/60 cursor-not-allowed border-none rounded-full font-semibold" disabled>
        Sold Out
      </Button>
    );
  }

  if (currentQuantity > 0) {
    return (
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 bg-primary/5 rounded-full px-4 py-2 w-fit border border-primary/10">
          <button 
            onClick={handleDecrease}
            aria-label="Decrease quantity"
            className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
          >
            <Minus className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center font-medium text-foreground">{currentQuantity}</span>
          <button 
            onClick={handleIncrease}
            disabled={currentQuantity >= product.stock_quantity}
            aria-label="Increase quantity"
            className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="text-sm font-semibold font-bold text-primary text-primary flex items-center">
          <Check className="w-4 h-4 mr-2" strokeWidth={2} />
          In your hamper
        </div>
      </div>
    );
  }

  return (
    <Button 
      size="lg" 
      onClick={handleAdd}
      className={`w-full sm:w-auto h-14 px-12 text-xs tracking-[0.2em] uppercase font-semibold rounded-full transition-all duration-300 ${adding ? 'bg-primary text-white' : 'bg-primary text-white hover:bg-primary'}`}
    >
      {adding ? (
        <><Check className="w-4 h-4 mr-3" /> Added</>
      ) : (
        <><Plus className="w-4 h-4 mr-3" /> Add to Hamper</>
      )}
    </Button>
  );
}
