'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { placeCustomerOrder } from '@/actions/checkout.actions';
import { ShoppingBag, Loader2, MapPin, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';

export function CheckoutForm({ customer }: { customer: any }) {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => router.push('/hampers')}
          className="px-6 py-2.5 bg-rose-600 text-white font-medium rounded-full hover:bg-rose-700 transition-colors"
        >
          Browse Hampers
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const result = await placeCustomerOrder(items);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Customer Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 font-serif mb-4">Delivery Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <User className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Name</p>
                <p className="text-slate-600">{customer.full_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Phone</p>
                <p className="text-slate-600">{customer.mobile_number || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Delivery Address</p>
                <p className="text-slate-600">
                  {customer.address ? (
                    <span className="whitespace-pre-wrap">{customer.address}</span>
                  ) : (
                    <span className="italic text-slate-400">No address provided. We will contact you to confirm delivery details.</span>
                  )}
                </p>
                <button 
                  onClick={() => router.push('/account/profile')}
                  className="text-xs text-rose-600 hover:underline mt-2 font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 font-serif mb-4">Payment Method</h2>
          <div className="p-4 border-2 border-rose-600 rounded-xl bg-rose-50 flex items-center">
            <div className="w-4 h-4 rounded-full bg-rose-600 ring-4 ring-rose-200 mr-3 shrink-0"></div>
            <div>
              <p className="font-bold text-rose-900">Pay Later / Bank Transfer</p>
              <p className="text-sm text-rose-700 mt-1">Our team will contact you with payment links and finalize the delivery schedule after you confirm the order.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 font-serif mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Qty: {item.quantity}</p>
                  <p className="text-slate-900 font-medium text-sm mt-1">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 mb-6">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Delivery</span>
              <span>Calculated later</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-lg pt-2 border-t border-slate-100">
              <span>Total Due</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
