const fs = require('fs');
let content = fs.readFileSync('src/components/customer/CheckoutForm.tsx', 'utf8');

content = content.replace(
  `import { Button } from '@/components/ui/button';`,
  `import { Button } from '@/components/ui/button';\nimport vadodaraPincodes from '@/data/vadodara_pincodes.json';\nimport { Truck, Clock } from 'lucide-react';`
);

content = content.replace(
  `const [addressError, setAddressError] = useState(false);`,
  `const [addressError, setAddressError] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'local' | 'national'>('idle');`
);

content = content.replace(
  `const result = await placeCustomerOrder(items, address);`,
  `const fullAddress = \`[Pincode: \${pincode}] \${address}\`;
      const result = await placeCustomerOrder(items, fullAddress);`
);

content = content.replace(
  `if (!address.trim()) {`,
  `if (pincodeStatus === 'idle' || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit Pincode first.');
      document.getElementById('delivery-pincode')?.focus();
      return;
    }
    if (!address.trim()) {`
);

const uiToReplace = `<div className="flex items-start">
              <MapPin className="w-5 h-5 text-primary/60 mr-4 mt-2" strokeWidth={1.5} />
              <div className="w-full">
                <p className="text-sm font-semibold text-foreground/60 mb-2">Delivery Address <span className="text-red-500">*</span></p>`;

const newUI = `<div className="flex items-start">
              <MapPin className="w-5 h-5 text-primary/60 mr-4 mt-2" strokeWidth={1.5} />
              <div className="w-full">
                <p className="text-sm font-semibold text-foreground/60 mb-2">Pincode <span className="text-red-500">*</span></p>
                <input
                  id="delivery-pincode"
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\\D/g, '');
                    setPincode(val);
                    if (val.length === 6) {
                      setPincodeStatus(vadodaraPincodes.includes(val) ? 'local' : 'national');
                    } else {
                      setPincodeStatus('idle');
                    }
                  }}
                  placeholder="Enter 6-digit Pincode"
                  className="w-full p-4 mb-2 text-sm font-medium border border-primary/20 rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-primary/5 transition-all"
                  required
                />
                
                {pincodeStatus === 'local' && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start text-emerald-800 transition-all">
                    <Truck className="w-5 h-5 mr-2 mt-0.5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Local Vadodara Delivery</p>
                      <p className="text-xs mt-0.5 opacity-90">Estimated Delivery: Same day or within 24 hours.</p>
                    </div>
                  </div>
                )}
                
                {pincodeStatus === 'national' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start text-blue-800 transition-all">
                    <Truck className="w-5 h-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Standard National Delivery</p>
                      <p className="text-xs mt-0.5 opacity-90">Estimated Delivery: 3-5 business days.</p>
                    </div>
                  </div>
                )}

                <p className="text-sm font-semibold text-foreground/60 mb-2 mt-4 flex items-center">
                  Delivery Address <span className="text-red-500 ml-1">*</span>
                  {pincodeStatus === 'idle' && <span className="text-xs font-normal ml-2 text-foreground/40">(Enter pincode first)</span>}
                </p>`;

content = content.replace(uiToReplace, newUI);

content = content.replace(
  `required
                />`,
  `required
                  disabled={pincodeStatus === 'idle'}
                />`
);

content = content.replace(
  `className={\`w-full min-h-[120px] p-4 text-sm font-medium border rounded-2xl focus:outline-none focus:ring-1 bg-primary/5 resize-y transition-all \${`,
  `className={\`w-full min-h-[120px] p-4 text-sm font-medium border rounded-2xl focus:outline-none focus:ring-1 resize-y transition-all \${pincodeStatus === 'idle' ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'bg-primary/5'} \${`
);

fs.writeFileSync('src/components/customer/CheckoutForm.tsx', content, 'utf8');
console.log('CheckoutForm patched successfully!');
