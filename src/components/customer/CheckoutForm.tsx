'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { placeCustomerOrder } from '@/actions/checkout.actions';
import { ShoppingBag, MapPin, Phone, User, Check, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export function CheckoutForm({ customer }: { customer: any }) {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState(customer?.address || '');

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-primary/10 p-16 text-center shadow-sm max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary/40 mx-auto mb-6">
          <ShoppingBag className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Your bag is empty</h2>
        <p className="text-foreground/70 mb-8 font-light text-lg">Looks like you haven't added any beautiful gifts yet.</p>
        <button 
          onClick={() => router.push('/hampers')}
          className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:scale-105 shadow-lg shadow-primary/20 transition-all text-sm"
        >
          Browse Collections
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error('Please provide a delivery address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await placeCustomerOrder(items, address);
      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
      } else {
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/checkout/success/${result.purchaseId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
      {/* Left Column: Customer Details */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl border border-primary/10 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground font-serif mb-6 flex items-center">
             <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-sans mr-3">1</span>
             Delivery Details
          </h2>
          <div className="space-y-6 pl-11">
            <div className="flex items-start">
              <User className="w-5 h-5 text-primary/60 mr-4 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-foreground/60 mb-1">Recipient Name</p>
                <p className="text-foreground font-medium">{customer.full_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-primary/60 mr-4 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-foreground/60 mb-1">Contact Phone</p>
                <p className="text-foreground font-medium">{customer.mobile_number || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-primary/60 mr-4 mt-2" strokeWidth={1.5} />
              <div className="w-full">
                <p className="text-sm font-semibold text-foreground/60 mb-2">Delivery Address</p>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address here..."
                  className="w-full min-h-[120px] p-4 text-sm font-medium border border-primary/20 rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-primary/5 resize-y transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-primary/10 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground font-serif mb-6 flex items-center">
             <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-sans mr-3">2</span>
             Payment Method
          </h2>
          <div className="pl-11">
            <div className="p-6 border-2 border-primary rounded-2xl bg-primary/5 flex items-start">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mr-4 mt-0.5 text-white">
                 <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <div>
                <p className="font-bold text-foreground">Pay Later / Bank Transfer</p>
                <p className="text-sm text-foreground/70 mt-2 font-light leading-relaxed">
                  Our team will contact you with secure payment links and finalize your preferred delivery schedule once your order is confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div>
        <div className="bg-white rounded-3xl border border-primary/10 p-8 shadow-sm sticky top-28">
          <h2 className="text-2xl font-bold text-foreground font-serif mb-8">Order Summary</h2>
          
          <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center relative flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="text-primary/30">
                      {item.itemType === 'PRODUCT' ? <PackageOpen className="w-6 h-6" strokeWidth={1.5} /> : <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-foreground text-sm line-clamp-2 leading-snug">{item.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-foreground/60 text-xs font-semibold">Qty: {item.quantity}</p>
                    <p className="text-primary font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-primary/10 pt-6 space-y-4 mb-8">
            <div className="flex justify-between text-foreground/70 text-sm font-medium">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground/70 text-sm font-medium">
              <span>Delivery</span>
              <span className="italic text-foreground/50">Calculated later</span>
            </div>
            <div className="flex justify-between text-foreground font-bold text-xl pt-4 border-t border-primary/10">
              <span>Total Due</span>
              <span className="text-primary">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            isLoading={isSubmitting}
            onClick={handlePlaceOrder}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 text-base transition-transform hover:scale-[1.02]"
          >
            Confirm Order
          </Button>
        </div>
      </div>
    </div>
  );
}
