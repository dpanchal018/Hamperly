const fs = require('fs');
let content = fs.readFileSync('src/components/customer/CheckoutForm.tsx', 'utf8');

// Update state type
content = content.replace(
  `const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'local' | 'national'>('idle');`,
  `const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'local' | 'national' | 'invalid'>('idle');`
);

// Update placeCustomerOrder call
content = content.replace(
  `const fullAddress = \`[Pincode: \${pincode}] \${address}\`;
      const result = await placeCustomerOrder(items, fullAddress);`,
  `const result = await placeCustomerOrder(items, address, pincode);`
);

// Update onChange logic
const oldOnChange = `                  onChange={(e) => {
                    const val = e.target.value.replace(/\\D/g, '');
                    setPincode(val);
                    if (val.length === 6) {
                      setPincodeStatus(vadodaraPincodes.includes(val) ? 'local' : 'national');
                    } else {
                      setPincodeStatus('idle');
                    }
                  }}`;

const newOnChange = `                  onChange={(e) => {
                    const val = e.target.value.replace(/\\D/g, '');
                    setPincode(val);
                    if (val.length === 6) {
                      if (vadodaraPincodes.includes(val)) {
                        setPincodeStatus('local');
                      } else {
                        setPincodeStatus('checking');
                        fetch(\`https://api.postalpincode.in/pincode/\${val}\`)
                          .then(res => res.json())
                          .then(data => {
                            if (data && data[0] && data[0].Status === 'Success') {
                              setPincodeStatus('national');
                            } else {
                              setPincodeStatus('invalid');
                            }
                          })
                          .catch(() => setPincodeStatus('national')); // fallback
                      }
                    } else {
                      setPincodeStatus('idle');
                    }
                  }}
                  disabled={pincodeStatus === 'checking'}`;

content = content.replace(oldOnChange, newOnChange);

// Add loading/invalid UI and update textarea disabled condition
const newBadges = `
                {pincodeStatus === 'checking' && (
                  <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start text-slate-600 transition-all">
                    <div className="w-5 h-5 mr-2 mt-0.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Verifying Pincode...</p>
                    </div>
                  </div>
                )}

                {pincodeStatus === 'invalid' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-800 transition-all">
                    <MapPin className="w-5 h-5 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Invalid Pincode</p>
                      <p className="text-xs mt-0.5 opacity-90">This pincode does not exist. Please check and try again.</p>
                    </div>
                  </div>
                )}
`;

content = content.replace(
  `{pincodeStatus === 'local' && (`,
  newBadges + `{pincodeStatus === 'local' && (`
);

// Update textarea disabled condition to also disable on invalid or checking
content = content.replace(
  `disabled={pincodeStatus === 'idle'}`,
  `disabled={pincodeStatus === 'idle' || pincodeStatus === 'invalid' || pincodeStatus === 'checking'}`
);

content = content.replace(
  `{pincodeStatus === 'idle' ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'bg-primary/5'}`,
  `{['idle', 'invalid', 'checking'].includes(pincodeStatus) ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'bg-primary/5'}`
);

content = content.replace(
  `{pincodeStatus === 'idle' && <span className="text-xs font-normal ml-2 text-foreground/40">(Enter pincode first)</span>}`,
  `{['idle', 'invalid', 'checking'].includes(pincodeStatus) && <span className="text-xs font-normal ml-2 text-foreground/40">(Enter a valid pincode first)</span>}`
);

// Update placeOrder check
content = content.replace(
  `if (pincodeStatus === 'idle' || pincode.length !== 6) {`,
  `if (['idle', 'invalid', 'checking'].includes(pincodeStatus) || pincode.length !== 6) {`
);

fs.writeFileSync('src/components/customer/CheckoutForm.tsx', content, 'utf8');
console.log('Checkout API logic patched');
