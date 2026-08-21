'use client';

import { Package, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { searchHamperByName } from '@/actions/storefront.actions';

export function OrderAgainButton({ hamperName }: { hamperName: string }) {
  const { items, addItem, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);

  const handleOrderAgain = async () => {
    try {
      setLoading(true);
      
      const { hamper, error } = await searchHamperByName(hamperName);
      if (error || !hamper) {
        toast.error('This hamper is no longer available');
        return;
      }

      const existingItem = items.find(i => i.id === hamper.id);
      
      if (existingItem) {
        if (existingItem.quantity >= hamper.stock_quantity) {
          toast.error(`Only ${hamper.stock_quantity} left in stock`);
        } else {
          updateQuantity(hamper.id, existingItem.quantity + 1);
          toast.success('Added to cart');
        }
      } else {
        if (hamper.stock_quantity <= 0) {
          toast.error('This hamper is out of stock');
        } else {
          addItem({
            id: hamper.id,
            name: hamper.name,
            price: hamper.selling_price,
            imageUrl: hamper.image_url,
            maxQuantity: hamper.stock_quantity,
            itemType: 'HAMPER'
          });
          toast.success('Added to cart');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to order again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleOrderAgain}
      disabled={loading}
      className="inline-flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
      Order Again
    </button>
  );
}
