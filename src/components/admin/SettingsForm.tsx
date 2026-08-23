'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { StoreSettings } from '@/types/database.types';
import { updateStoreSettings } from '@/actions/settings.actions';
import { toast } from 'react-hot-toast';
import { Save, Store, CreditCard, ShieldAlert } from 'lucide-react';

const settingsSchema = z.object({
  store_name: z.string().min(1, 'Store name is required'),
  support_email: z.string().email('Invalid email').or(z.literal('')),
  support_phone: z.string().optional(),
  store_announcement: z.string().optional(),
  enable_ai_designer: z.boolean(),
  accept_new_orders: z.boolean(),
  maintenance_mode: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ initialSettings }: { initialSettings: StoreSettings }) {
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      store_name: initialSettings.store_name,
      support_email: initialSettings.support_email || '',
      support_phone: initialSettings.support_phone || '',
      store_announcement: initialSettings.store_announcement || '',
      enable_ai_designer: initialSettings.enable_ai_designer,
      accept_new_orders: initialSettings.accept_new_orders,
      maintenance_mode: initialSettings.maintenance_mode,
    }
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const { success, error } = await updateStoreSettings(data);
      if (success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error(error || 'Failed to save settings');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* General Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <Store className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-semibold text-slate-800">General Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
            <input 
              {...register('store_name')} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.store_name && <p className="text-red-500 text-sm mt-1">{errors.store_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store Announcement (Banner)</label>
            <input 
              {...register('store_announcement')} 
              placeholder="e.g. Free shipping on all orders!"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
            <input 
              {...register('support_email')} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.support_email && <p className="text-red-500 text-sm mt-1">{errors.support_email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Support Phone</label>
            <input 
              {...register('support_phone')} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h2 className="text-xl font-semibold text-slate-800">Feature Toggles</h2>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              {...register('enable_ai_designer')} 
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <div className="font-medium text-slate-900">Enable AI Designer</div>
              <div className="text-sm text-slate-500">Allow customers to use Gemini AI for hamper generation.</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              {...register('accept_new_orders')} 
              className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <div className="font-medium text-slate-900">Accept New Orders</div>
              <div className="text-sm text-slate-500">Allow customers to complete checkout and place orders.</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors border border-red-100">
            <input 
              type="checkbox" 
              {...register('maintenance_mode')} 
              className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500"
            />
            <div>
              <div className="font-medium text-red-900">Maintenance Mode</div>
              <div className="text-sm text-red-700">Display a maintenance banner and block all customer interactions.</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all shadow-sm"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

    </form>
  );
}
