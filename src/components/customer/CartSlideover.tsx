'use client';

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Minus, Plus, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getStorefrontProducts } from '@/actions/storefront.actions';

export function CartSlideover({ user }: { user?: any }) {
  const { isCartOpen, setIsCartOpen, items, removeItem, updateQuantity, subtotal, addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isCartOpen && products.length === 0) {
      getStorefrontProducts().then(res => {
        if (res.products) setProducts(res.products);
      });
    }
  }, [isCartOpen, products.length]);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold font-serif text-slate-900">Your Cart</h2>
            <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-200 mb-2">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <p className="text-slate-500">Your cart is empty</p>
              <Button 
                onClick={() => setIsCartOpen(false)}
                variant="outline" 
                className="mt-4 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full"
              >
                Browse Hampers
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex space-x-4 bg-white">
                  <div className="w-20 h-20 rounded-2xl bg-rose-50 overflow-hidden shrink-0 border border-slate-100 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-200">
                        {item.itemType === 'PRODUCT' ? <PackageOpen className="w-8 h-8" /> : <ShoppingBag className="w-8 h-8" />}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 truncate pr-4">{item.name}</h3>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-rose-600 font-medium text-sm mb-auto">₹{item.price.toFixed(2)}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-slate-900">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                          disabled={item.quantity >= item.maxQuantity}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add-on Customizations Section */}
              <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <PackageOpen className="w-4 h-4 mr-2 text-rose-500" />
                  Add Customizations & Extras
                </h4>
                <div className="space-y-3">
                  <select 
                    className="w-full text-sm rounded-xl border-slate-200 focus:border-rose-300 focus:ring-rose-200 bg-slate-50 p-3"
                    onChange={(e) => {
                      const prodId = e.target.value;
                      if (!prodId) return;
                      const product = products.find(p => p.id === prodId);
                      if (product) {
                        addItem({
                          id: product.id,
                          name: product.name,
                          price: product.selling_price,
                          imageUrl: product.image_url,
                          maxQuantity: product.stock_quantity,
                          itemType: 'PRODUCT'
                        });
                      }
                      e.target.value = ''; // Reset select
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select an extra item...</option>
                    {products.map(p => {
                      const inCart = items.find(i => i.id === p.id);
                      if (inCart) return null; // hide if already in cart
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} - ₹{p.selling_price.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 p-6 bg-slate-50/50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-500 text-center mb-4">
              Shipping and taxes calculated at checkout.
            </p>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                if (!user) {
                  toast.error("Login to Proceed");
                  router.push('/login');
                } else {
                  router.push('/checkout');
                }
              }}
              className="w-full flex items-center justify-center py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-sm shadow-rose-200 transition-all hover:shadow-md"
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
