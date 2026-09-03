'use client';

import { useState } from 'react';
import { updateCustomer } from '@/actions/customer.actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PhoneField } from '@/components/ui/PhoneField';
import { validatePhoneNumber } from '@/lib/phone';
import { Edit2 } from 'lucide-react';

export function EditCustomerModal({ customer }: { customer: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: customer.full_name || '',
    mobile_number: customer.mobile_number || '',
    email: customer.email || '',
    address: customer.address || '',
    city: customer.city || '',
    notes: customer.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      toast.error('Name is required');
      return;
    }

    if (formData.mobile_number) {
      const phoneValidation = validatePhoneNumber(formData.mobile_number);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || 'Please enter a valid phone number');
        return;
      }
      formData.mobile_number = phoneValidation.normalized || formData.mobile_number;
    }

    const promise = updateCustomer(customer.id, formData);
    
    toast.promise(promise, {
      loading: 'Updating customer...',
      success: (res) => {
        if ('error' in res && res.error) throw new Error(res.error);
        setIsOpen(false);
        router.refresh();
        return 'Customer updated successfully!';
      },
      error: (err) => err.message || 'Failed to update customer'
    });
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline" 
        size="sm" 
        className="ml-auto flex items-center text-slate-600 hover:text-indigo-600"
      >
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Profile
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">Edit Customer</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input 
              type="text" 
              value={formData.full_name} 
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <PhoneField 
              value={formData.mobile_number} 
              onChange={val => setFormData({ ...formData, mobile_number: val || '' })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input 
              type="text" 
              value={formData.city} 
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
            <textarea 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Special Instructions</label>
            <textarea 
              value={formData.notes} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="pt-4 flex space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1 text-slate-600">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
