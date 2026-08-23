import { getStoreSettings } from '@/actions/settings.actions';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { settings, error } = await getStoreSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-3">
        <div className="bg-slate-100 p-2 rounded-lg">
          <Settings className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
          <p className="text-slate-500 mt-1">Configure your storefront, feature flags, and manage admin users.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Error loading settings: {error}
        </div>
      )}

      {settings && <SettingsForm initialSettings={settings} />}
      
      <AdminUsersManager />
    </div>
  );
}
