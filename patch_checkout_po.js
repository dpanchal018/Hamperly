const fs = require('fs');
let content = fs.readFileSync('src/components/customer/CheckoutForm.tsx', 'utf8');

// 1. Add new state variables
content = content.replace(
  `const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'local' | 'national' | 'invalid'>('idle');`,
  `const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'local' | 'national' | 'invalid'>('idle');
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [deliverToPO, setDeliverToPO] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');`
);

// 2. Update API fetch logic to save post offices
const oldFetch = `fetch(\`https://api.postalpincode.in/pincode/\${val}\`)
                          .then(res => res.json())
                          .then(data => {
                            if (data && data[0] && data[0].Status === 'Success') {
                              setPincodeStatus('national');
                            } else {
                              setPincodeStatus('invalid');
                            }
                          })
                          .catch(() => setPincodeStatus('national')); // fallback`;

const newFetch = `fetch(\`https://api.postalpincode.in/pincode/\${val}\`)
                          .then(res => res.json())
                          .then(data => {
                            if (data && data[0] && data[0].Status === 'Success') {
                              setPincodeStatus('national');
                              if (data[0].PostOffice && Array.isArray(data[0].PostOffice)) {
                                setPostOffices(data[0].PostOffice);
                                setSelectedPO(data[0].PostOffice[0].Name);
                              }
                            } else {
                              setPincodeStatus('invalid');
                              setPostOffices([]);
                            }
                          })
                          .catch(() => {
                            setPincodeStatus('national');
                            setPostOffices([]);
                          });`;

content = content.replace(oldFetch, newFetch);

// 3. Add PO UI for national delivery
const oldNationalUI = `{pincodeStatus === 'national' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start text-blue-800 transition-all">
                    <Truck className="w-5 h-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Standard National Delivery</p>
                      <p className="text-xs mt-0.5 opacity-90">Estimated Delivery: 3-5 business days.</p>
                    </div>
                  </div>
                )}`;

const newNationalUI = `{pincodeStatus === 'national' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start text-blue-800 transition-all">
                    <Truck className="w-5 h-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div className="w-full">
                      <p className="font-bold text-sm">Standard National Delivery</p>
                      <p className="text-xs mt-0.5 opacity-90 mb-3">Estimated Delivery: 3-5 business days.</p>
                      
                      {postOffices.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <label className="flex items-start cursor-pointer group">
                            <div className="flex items-center h-5">
                              <input 
                                type="checkbox" 
                                checked={deliverToPO}
                                onChange={(e) => setDeliverToPO(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                              />
                            </div>
                            <div className="ml-2">
                              <p className="text-sm font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                                Rural Area? Deliver to nearest Post Office
                              </p>
                              <p className="text-xs text-blue-700 opacity-80 mt-0.5">
                                Recommended if direct delivery is difficult in your region.
                              </p>
                            </div>
                          </label>
                          
                          {deliverToPO && (
                            <div className="mt-3 ml-6">
                              <p className="text-xs font-semibold text-blue-800 mb-1">Select Post Office Branch:</p>
                              <select 
                                value={selectedPO}
                                onChange={(e) => setSelectedPO(e.target.value)}
                                className="w-full p-2 text-sm border border-blue-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                              >
                                {postOffices.map((po: any, idx: number) => (
                                  <option key={idx} value={po.Name}>
                                    {po.Name} {po.BranchType === 'Branch Post Office' ? '(Rural Branch)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}`;

content = content.replace(oldNationalUI, newNationalUI);

// 4. Update submission address logic
content = content.replace(
  `const result = await placeCustomerOrder(items, address, pincode);`,
  `const finalAddress = deliverToPO ? \`[POST OFFICE PICKUP: \${selectedPO}] \${address}\` : address;
      const result = await placeCustomerOrder(items, finalAddress, pincode);`
);

fs.writeFileSync('src/components/customer/CheckoutForm.tsx', content, 'utf8');
console.log('Post office UI patched successfully!');
