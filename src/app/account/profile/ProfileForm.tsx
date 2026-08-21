'use client';

import { useState } from 'react';
import { updateMyProfile } from '@/actions/account.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export function ProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    full_name: initialData.full_name || '',
    mobile_number: initialData.mobile_number || '',
    city: initialData.city || '',
    address: initialData.address || ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await updateMyProfile(data);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Profile updated successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
          <Input 
            value={data.full_name}
            onChange={(e) => setData({ ...data, full_name: e.target.value })}
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
          <Input 
            value={data.mobile_number}
            onChange={(e) => setData({ ...data, mobile_number: e.target.value })}
            type="tel"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address (Cannot be changed)</label>
        <Input 
          value={initialData.email}
          disabled
          className="bg-slate-50 text-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
        <Input 
          value={data.city}
          onChange={(e) => setData({ ...data, city: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
        <Textarea 
          value={data.address}
          onChange={(e) => setData({ ...data, address: e.target.value })}
          rows={3}
        />
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <Button type="submit" disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
