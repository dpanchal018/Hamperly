'use client';

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Minus, Plus, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import { AuthModal } from './AuthModal';

export function CartSlideover({ user }: { user?: any }) {
  const { isCartOpen, setIsCartOpen, items, removeItem, updateQuantity, subtotal, addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
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
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform rounded-l-3xl">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center space-x-2 text-primary">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            <h2 className="text-xl font-bold font-serif">Your Bag</h2>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 bg-primary/5 rounded-full text-primary hover:bg-primary/10 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background/50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary/40">
                <ShoppingBag className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <p className="text-foreground/70 font-light text-lg">Your bag is empty.</p>
              <Button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 rounded-full px-8 h-12 text-sm font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                Browse Collection
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex space-x-4 bg-white p-4 rounded-3xl shadow-sm border border-primary/5">
                  <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill
                        sizes="80px"
                        className="object-cover" 
                      />
                    ) : (
                      <div className="text-primary/30">
                        {item.itemType === 'PRODUCT' ? <PackageOpen className="w-8 h-8" strokeWidth={1.5} /> : <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0 justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-foreground pr-4 text-sm leading-tight">{item.name}</h3>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-foreground/40 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-primary font-bold text-sm">₹{item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center mt-2 border border-primary/10 rounded-full w-fit bg-primary/5">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-primary">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        <Plus className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add-on Customizations Section */}
              <div className="mt-8 pt-6 border-t border-primary/10">
                <h4 className="text-sm font-bold text-foreground mb-4">
                  Add Extras & Treats
                </h4>
                <div>
                  <select 
                    className="w-full text-sm border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary bg-white p-4 font-light text-foreground rounded-2xl outline-none shadow-sm"
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
                          {p.name} — ₹{p.selling_price.toFixed(2)}
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
          <div className="border-t border-primary/10 p-6 bg-white rounded-bl-3xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-foreground/70 font-bold">Subtotal</span>
              <span className="text-2xl font-serif font-bold text-primary">₹{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-foreground/50 font-light mb-6 text-center">
              Shipping & taxes calculated at checkout.
            </p>
            <button 
              onClick={() => {
                if (!user) {
                  setShowAuthModal(true);
                } else {
                  setIsCartOpen(false);
                  router.push('/checkout');
                }
              }}
              className="w-full flex items-center justify-center h-14 bg-primary hover:bg-primary/90 text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
