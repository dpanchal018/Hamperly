'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { PublicProduct } from '@/services/catalog.service';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { getInventoryStatus } from '@/lib/inventory';

interface Props {
  product: PublicProduct;
}

export function ProductDetailActions({ product }: Props) {
  const { items, addItem, updateQuantity, setIsCartOpen } = useCart();
  const [adding, setAdding] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  const status = getInventoryStatus(product.stock_quantity);
  const isOutOfStock = status === 'OUT OF STOCK';
  
  const selectedItem = items.find(i => i.id === product.id && i.itemType === 'PRODUCT');
  const currentQuantity = selectedItem ? selectedItem.quantity : 0;
  
  const handleAdd = () => {
    if (isOutOfStock) return;
    setAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      imageUrl: product.primary_image_url,
      maxQuantity: product.stock_quantity,
      itemType: 'PRODUCT'
    }, 1);
    setIsCartOpen(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdding(false), 500);
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
            disabled={product.stock_quantity !== null && currentQuantity >= product.stock_quantity}
            aria-label="Increase quantity"
            className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="text-sm font-semibold font-bold text-primary flex items-center">
          <Check className="w-4 h-4 mr-2" strokeWidth={2} />
          In your bag
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
        <><ShoppingBag className="w-4 h-4 mr-3" /> Add to Bag</>
      )}
    </Button>
  );
}
