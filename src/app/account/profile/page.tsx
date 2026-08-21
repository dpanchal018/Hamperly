import { getMyProfile } from '@/actions/account.actions';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerProfilePage() {
  const { customer, error } = await getMyProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-500 mt-2">Manage your personal information and contact details.</p>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">Error loading profile: {error}</div>
      ) : (
        <ProfileForm initialData={customer} />
      )}
    </div>
  );
}
