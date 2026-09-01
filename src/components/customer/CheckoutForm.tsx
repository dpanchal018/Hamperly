'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { placeCustomerOrder } from '@/actions/checkout.actions';
import { ShoppingBag, MapPin, Phone, User, Mail, Check, PackageOpen, Truck, Clock, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import vadodaraPincodes from '@/data/vadodara_pincodes.json';

export function CheckoutForm({ customer }: { customer: any }) {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState(customer?.address || '');
  const [addressError, setAddressError] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'local' | 'national' | 'invalid'>('idle');
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [deliverToPO, setDeliverToPO] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');

  // Guest fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-primary/10 p-16 text-center shadow-sm max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary/40 mx-auto mb-6">
          <ShoppingBag className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-foreground mb-4 tracking-tight">Your cart is empty</h2>
        <p className="text-foreground/60 mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Let's find something special.</p>
        <Button onClick={() => router.push('/products')} className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white">
          Continue Shopping
        </Button>
      </div>
    );
  }

  const validatePincode = async (val: string) => {
    setPincode(val);
    setPostOffices([]);
    setDeliverToPO(false);
    setSelectedPO('');

    if (val.length === 6 && /^\d+$/.test(val)) {
      setPincodeStatus('checking');
      if (vadodaraPincodes.includes(val)) {
        setPincodeStatus('local');
      } else {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            setPincodeStatus('national');
            if (data[0].PostOffice && Array.isArray(data[0].PostOffice)) {
              setPostOffices(data[0].PostOffice);
              setSelectedPO(data[0].PostOffice[0].Name);
            }
          } else {
            setPincodeStatus('invalid');
          }
        } catch (err) {
          console.error("Pincode API error", err);
          setPincodeStatus('invalid');
        }
      }
    } else {
      setPincodeStatus('idle');
    }
  };

  const handlePlaceOrder = async () => {
    if (!customer) {
      if (!guestName || !guestEmail || !guestPhone) {
        return toast.error("Please fill in your contact details.");
      }
      if (!/^\S+@\S+\.\S+$/.test(guestEmail)) {
        return toast.error("Please enter a valid email address.");
      }
    }

    if (['idle', 'invalid', 'checking'].includes(pincodeStatus) || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit Pincode first.');
      document.getElementById('delivery-pincode')?.focus();
      return;
    }
    if (!address.trim()) {
      setAddressError(true);
      toast.error('Please provide a delivery address.');
      document.getElementById('delivery-address')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('delivery-address')?.focus();
      return;
    }
    setAddressError(false);

    setIsSubmitting(true);
    try {
      const finalAddress = deliverToPO ? `[POST OFFICE PICKUP: ${selectedPO}] ${address}` : address;
      
      const guestDetails = customer ? undefined : {
        fullName: guestName,
        email: guestEmail,
        phone: guestPhone
      };

      const result = await placeCustomerOrder(items, finalAddress, pincode, guestDetails);
      
      if (!result.success || result.error) {
        toast.error(result.error || 'Failed to place order');
        setIsSubmitting(false);
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        router.push(`/checkout/success/${result.purchaseId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  const isAddressDisabled = ['idle', 'invalid', 'checking'].includes(pincodeStatus) || pincode.length !== 6;

  return (
    <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto items-start">
      <div className="lg:col-span-7 space-y-8">
        
        {/* Contact Information */}
        <div className="bg-white rounded-3xl p-8 border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">1</span>
            Contact Information
          </h2>
          
          {customer ? (
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
                  <p className="text-sm font-semibold text-foreground/60 mb-1">Mobile Number</p>
                  <p className="text-foreground font-medium">{customer.mobile_number || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pl-11">
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">You are checking out as a Guest. We'll use these details to update you on your order.</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full rounded-xl border-slate-200 px-4 py-3" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full rounded-xl border-slate-200 px-4 py-3" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full rounded-xl border-slate-200 px-4 py-3" placeholder="+91 9876543210" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-3xl p-8 border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">2</span>
            Delivery Details
          </h2>
          <div className="space-y-6 pl-11">
            
            {/* Pincode Input */}
            <div className="relative">
              <label htmlFor="delivery-pincode" className="block text-sm font-semibold text-foreground/60 mb-2">Delivery Pincode</label>
              <div className="flex gap-4">
                <input
                  id="delivery-pincode"
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => validatePincode(e.target.value)}
                  className={`flex-1 max-w-[200px] h-12 bg-white rounded-xl border px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono tracking-widest text-lg ${pincodeStatus === 'invalid' ? 'border-red-300' : 'border-primary/20'}`}
                  placeholder="390001"
                />
                
                {/* Status Badges */}
                {pincodeStatus === 'checking' && (
                  <div className="flex items-center text-primary/60 animate-pulse"><Clock className="w-5 h-5 mr-2" /> Checking...</div>
                )}
                {pincodeStatus === 'local' && (
                  <div className="flex items-center text-emerald-600 bg-emerald-50 px-4 rounded-xl border border-emerald-100">
                    <Truck className="w-5 h-5 mr-2" /> Local Vadodara Delivery (Next Day)
                  </div>
                )}
                {pincodeStatus === 'national' && (
                  <div className="flex items-center text-indigo-600 bg-indigo-50 px-4 rounded-xl border border-indigo-100">
                    <PackageOpen className="w-5 h-5 mr-2" /> National Delivery (4-5 Days)
                  </div>
                )}
                {pincodeStatus === 'invalid' && (
                  <div className="flex items-center text-red-500 bg-red-50 px-4 rounded-xl border border-red-100">
                    Invalid Pincode
                  </div>
                )}
              </div>
            </div>

            {/* Rural Delivery Option for National Orders */}
            {pincodeStatus === 'national' && postOffices.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 mt-4">
                <label className="flex items-start cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5 mr-3">
                    <input 
                      type="checkbox" 
                      checked={deliverToPO}
                      onChange={(e) => setDeliverToPO(e.target.checked)}
                      className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer peer" 
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-orange-900 block mb-1">Deliver to nearest Post Office (Rural Area)</span>
                    <span className="text-sm text-orange-700/80 leading-relaxed block">If your exact address is difficult to locate, we can ship your hamper directly to your local post office for secure pickup.</span>
                  </div>
                </label>
                
                {deliverToPO && (
                  <div className="mt-4 ml-8 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-semibold text-orange-900/80 mb-2">Select Post Office Branch</label>
                    <select 
                      value={selectedPO}
                      onChange={(e) => setSelectedPO(e.target.value)}
                      className="w-full max-w-sm h-11 bg-white rounded-lg border-orange-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                    >
                      {postOffices.map((po, idx) => (
                        <option key={idx} value={po.Name}>{po.Name} ({po.BranchType})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Full Address Input */}
            <div className={`transition-opacity duration-300 ${isAddressDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <label htmlFor="delivery-address" className="block text-sm font-semibold text-foreground/60 mb-2">Full Delivery Address</label>
              <textarea
                id="delivery-address"
                disabled={isAddressDisabled}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={`w-full bg-slate-50/50 rounded-xl border p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none ${addressError ? 'border-red-300 ring-2 ring-red-100 bg-red-50/10' : 'border-primary/10'}`}
                placeholder={isAddressDisabled ? "Please enter a valid pincode first" : "House/Flat No, Building Name\nStreet Name, Landmark"}
              />
              {addressError && <p className="text-red-500 text-sm mt-2 flex items-center"><Check className="w-4 h-4 mr-1" /> Address is required.</p>}
            </div>
            
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 relative">
        <div className="sticky top-24 bg-white rounded-3xl p-8 border border-primary/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-serif font-bold text-foreground mb-6 border-b border-primary/10 pb-4">Order Summary</h3>
          <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {items.map((item, index) => {
              const isPersonalized = item.itemType === 'PERSONALIZED_HAMPER';

              return (
                <div key={index} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        {isPersonalized && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Bespoke Hamper
                          </span>
                        )}
                        <p className="font-serif font-bold text-foreground">{item.name}</p>
                      </div>
                      <p className="text-foreground/50 text-xs mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-foreground whitespace-nowrap">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>

                  {/* Personalized details breakdown */}
                  {isPersonalized && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs text-slate-500">
                      {item.occasion && (
                        <p><span className="font-medium text-slate-700">Theme:</span> {item.occasion.name}</p>
                      )}
                      {Array.isArray(item.products) && item.products.length > 0 && (
                        <p><span className="font-medium text-slate-700">Gifts:</span> {item.products.map((p: any) => `${p.name} (×${p.quantity})`).join(', ')}</p>
                      )}
                      {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                        <p><span className="font-medium text-slate-700">Style:</span> {item.customizations.map((c: any) => `${c.categoryName}: ${c.optionName}`).join(', ')}</p>
                      )}
                      {item.personalMessage && (
                        <p className="italic text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                          &ldquo;{item.personalMessage}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-primary/10 pt-4 mb-8 space-y-3">
            <div className="flex justify-between text-sm text-foreground/70">
              <p>Subtotal</p>
              <p>₹{subtotal.toLocaleString()}</p>
            </div>
            <div className="flex justify-between text-sm text-foreground/70">
              <p>Shipping</p>
              <p className="text-emerald-600 font-medium">Free</p>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-primary/5">
              <div>
                <p className="text-lg font-bold text-foreground">Total Due</p>
                <p className="text-xs text-foreground/50">Includes all taxes</p>
              </div>
              <p className="text-2xl font-serif font-bold text-primary">₹{subtotal.toLocaleString()}</p>
            </div>
          </div>

          <Button 
            disabled={isSubmitting || items.length === 0}
            onClick={handlePlaceOrder}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 text-base transition-transform hover:scale-[1.02]"
          >
            {isSubmitting ? 'Confirming Order...' : 'Confirm Order'}
          </Button>
          
          <p className="text-center text-xs text-foreground/50 mt-4 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 mr-1" /> Payment collected safely offline
          </p>
        </div>
      </div>
    </div>
  );
}
