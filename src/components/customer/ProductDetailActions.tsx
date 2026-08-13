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
      <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-slate-100 text-slate-500 cursor-not-allowed border-none" disabled>
        Out of Stock
      </Button>
    );
  }

  if (currentQuantity > 0) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full h-14 px-2">
          <button 
            onClick={handleDecrease}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <span className="w-12 text-center font-bold text-lg text-slate-900">{currentQuantity}</span>
          <button 
            onClick={handleIncrease}
            disabled={currentQuantity >= product.stock_quantity}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${currentQuantity >= product.stock_quantity ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center text-emerald-600 font-medium">
          <Check className="w-5 h-5 mr-2" />
          In your hamper
        </div>
      </div>
    );
  }

  return (
    <Button 
      size="lg" 
      onClick={handleAdd}
      className={`w-full sm:w-auto h-14 px-8 text-lg shadow-lg hover:shadow-xl transition-all ${adding ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-full`}
    >
      {adding ? (
        <><Check className="w-5 h-5 mr-2" /> Added</>
      ) : (
        <><ShoppingBag className="w-5 h-5 mr-2" /> Select for Hamper</>
      )}
    </Button>
  );
}
