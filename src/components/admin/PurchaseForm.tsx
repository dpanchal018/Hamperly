'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPurchase } from '@/actions/purchase.actions';
import { searchCustomers, createCustomer } from '@/actions/customer.actions';
import { getHampers } from '@/actions/hamper.actions';
import { Search, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export function PurchaseForm() {
  const router = useRouter();
  
  // Basic state for a simplified POS form
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [availableHampers, setAvailableHampers] = useState<any[]>([]);
  
  useEffect(() => {
    getHampers().then(setAvailableHampers);
  }, []);

  // For new customer
  const [newCustomer, setNewCustomer] = useState({ full_name: '', mobile_number: '' });
  
  // Hardcoded product for now to keep the demo simple (in a real app, this would be a searchable dropdown)
  // Or we just allow them to type the product ID. Let's do a simple array of items
  const [items, setItems] = useState<any[]>([{ 
    product_id: '', 
    product_name_snapshot: '', 
    category_snapshot: 'Custom',
    quantity: 1, 
    catalog_unit_price: 0, 
    actual_unit_price: 0,
    line_total: 0
  }]);

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [status, setStatus] = useState('COMPLETED');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearchCustomer = async () => {
    if (!customerSearch) return;
    const { customers: data } = await searchCustomers(customerSearch);
    if (data) setCustomers(data);
  };

  const handleCreateCustomer = async () => {
    const { customer: data, error } = await createCustomer(newCustomer);
    if (data) {
      setSelectedCustomer(data);
      setNewCustomer({ full_name: '', mobile_number: '' });
      toast.success('Customer created successfully!');
    }
    if (error) {
      setError(error);
      toast.error('Failed to create customer');
    }
  };

  const [discountAmount, setDiscountAmount] = useState(0);
  const [partialAmountPaid, setPartialAmountPaid] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedCustomer) {
      setError('Please select or create a customer first.');
      toast.error('Please select or create a customer first.');
      return;
    }

    setLoading(true);
    
    const subtotal = items.reduce((acc, item) => acc + item.line_total, 0);
    const final_amount = Math.max(0, subtotal - discountAmount);
    let amount_paid = 0;
    
    if (paymentStatus === 'PAID') {
      amount_paid = final_amount;
    } else if (paymentStatus === 'PARTIALLY_PAID') {
      if (partialAmountPaid <= 0 || partialAmountPaid >= final_amount) {
        setLoading(false);
        const msg = 'Partial amount paid must be greater than 0 and less than the final amount.';
        setError(msg);
        toast.error(msg);
        return;
      }
      amount_paid = partialAmountPaid;
    }

    const { purchase: data, error: submitError } = await createPurchase(
      {
        customer_id: selectedCustomer.id,
        sale_source: 'OTHER',
        subtotal,
        discount: discountAmount,
        amount_paid,
        payment_mode: paymentMode as any,
        payment_status: paymentStatus as any,
        status: (paymentStatus === 'PAID' ? status : 'PENDING') as any,
        notes: 'Manually recorded via Admin Panel',
      },
      items
    );

    setLoading(false);

    if (submitError) {
      setError(submitError);
      toast.error(submitError);
    } else {
      toast.success('Purchase recorded successfully!');
      router.push(`/admin/customers-purchases/${data?.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">1. Customer Details</h2>
        
        {!selectedCustomer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 border-r pr-8 border-slate-100">
              <h3 className="font-medium text-slate-700">Search Existing</h3>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  className="flex-1 rounded-lg border-slate-300 border px-3 text-sm" 
                  placeholder="Name or Mobile"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchCustomer();
                    }
                  }}
                />
                <Button type="button" onClick={handleSearchCustomer} variant="outline" size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                {customers.map(c => (
                  <div key={c.id} onClick={() => setSelectedCustomer(c)} className="p-3 border rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                    <div className="font-medium">{c.full_name}</div>
                    <div className="text-xs text-slate-500">{c.mobile_number}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-slate-700">Or Create New</h3>
              <input 
                type="text" 
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm" 
                placeholder="Full Name"
                value={newCustomer.full_name}
                onChange={e => setNewCustomer({...newCustomer, full_name: e.target.value})}
              />
              <input 
                type="text" 
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm" 
                placeholder="Mobile Number"
                value={newCustomer.mobile_number}
                onChange={e => setNewCustomer({...newCustomer, mobile_number: e.target.value})}
              />
              <Button type="button" onClick={handleCreateCustomer} className="w-full" variant="outline">
                Save & Select Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div>
              <div className="font-medium text-indigo-900 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" />
                {selectedCustomer.full_name}
              </div>
              <div className="text-sm text-indigo-700 mt-1 ml-6">{selectedCustomer.mobile_number}</div>
            </div>
            <Button type="button" onClick={() => setSelectedCustomer(null)} variant="ghost" className="text-indigo-600 hover:bg-indigo-100">
              Change
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">2. Order Details & Payment</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-slate-500 mb-2">
            <div className="col-span-4">Item Name</div>
            <div className="col-span-2">Original (₹)</div>
            <div className="col-span-2">Selling (₹)</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <input 
                  type="text" 
                  list={`hampers-list-${index}`}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"
                  value={item.product_name_snapshot}
                  onChange={e => {
                    const val = e.target.value;
                    const newItems = [...items];
                    newItems[index].product_name_snapshot = val;
                    
                    const selectedHamper = availableHampers.find(h => h.name === val);
                    if (selectedHamper) {
                      newItems[index].catalog_unit_price = selectedHamper.actual_cost;
                      newItems[index].actual_unit_price = selectedHamper.selling_price;
                      newItems[index].line_total = selectedHamper.selling_price * newItems[index].quantity;
                    }
                    
                    setItems(newItems);
                  }}
                  required
                  placeholder="Select or type..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
                <datalist id={`hampers-list-${index}`}>
                  {availableHampers.map(h => (
                    <option key={h.id} value={h.name} />
                  ))}
                </datalist>
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm text-slate-500"
                  value={item.catalog_unit_price}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[index].catalog_unit_price = Number(e.target.value);
                    setItems(newItems);
                  }}
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm font-medium text-slate-900"
                  value={item.actual_unit_price}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[index].actual_unit_price = Number(e.target.value);
                    newItems[index].line_total = newItems[index].actual_unit_price * newItems[index].quantity;
                    setItems(newItems);
                  }}
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"
                  value={item.quantity}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[index].quantity = Number(e.target.value);
                    newItems[index].line_total = newItems[index].actual_unit_price * newItems[index].quantity;
                    setItems(newItems);
                  }}
                  min="1"
                />
              </div>
              <div className="col-span-1 font-medium text-right text-slate-900">
                ₹{item.line_total}
              </div>
              <div className="col-span-1 flex justify-end">
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const newItems = [...items];
                      newItems.splice(index, 1);
                      setItems(newItems);
                    }}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setItems([...items, { 
                  product_id: '', 
                  product_name_snapshot: '', 
                  category_snapshot: 'Custom',
                  quantity: 1, 
                  catalog_unit_price: 0, 
                  actual_unit_price: 0,
                  line_total: 0
                }]);
              }}
              className="border-dashed border-2 text-slate-600 hover:text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Another Item
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
          <div className="w-full md:w-1/3 space-y-4">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-sm font-medium">Subtotal:</span>
              <span className="font-medium">₹{items.reduce((acc, item) => acc + item.line_total, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Global Discount (₹):</span>
              <input 
                type="number"
                className="w-32 rounded-lg border-slate-300 border px-3 py-1.5 text-sm text-right"
                value={discountAmount}
                onChange={e => setDiscountAmount(Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Final Amount:</span>
              <span>₹{Math.max(0, items.reduce((acc, item) => acc + item.line_total, 0) - discountAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Mode</label>
            <select 
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white"
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
            >
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Status</label>
            <div className="flex space-x-2">
              <select 
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white"
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
              >
                <option value="PAID">Paid in Full</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
              </select>
              {paymentStatus === 'PARTIALLY_PAID' && (
                <input
                  type="number"
                  placeholder="Amount Paid"
                  required
                  className="w-32 rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white text-right"
                  value={partialAmountPaid}
                  onChange={e => setPartialAmountPaid(Number(e.target.value))}
                  min="1"
                  max={Math.max(0, items.reduce((acc, item) => acc + item.line_total, 0) - discountAmount)}
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Order Status</label>
            <select 
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500"
              value={paymentStatus === 'PAID' ? status : 'PENDING'}
              onChange={e => setStatus(e.target.value)}
              disabled={paymentStatus !== 'PAID'}
            >
              <option value="COMPLETED">Completed (Deducts Stock)</option>
              <option value="PENDING">Pending (Draft)</option>
            </select>
            {paymentStatus !== 'PAID' && (
              <p className="text-xs text-amber-600 mt-1">Order cannot be Completed until fully Paid.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={loading || !selectedCustomer}>
          {loading ? 'Processing...' : 'Record Purchase'}
        </Button>
      </div>
    </form>
  );
}
