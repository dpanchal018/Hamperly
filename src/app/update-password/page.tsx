'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if there is an error in the hash fragment (e.g., otp_expired)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('error=')) {
        toast.error('The invitation link is invalid or has expired. Please ask for a new invite.');
      }
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Password updated successfully!');
      
      // Check role to redirect appropriately
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
        if (roleData?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-rose-50/30 px-4 py-8 pt-10 text-center sm:px-16">
          <Logo className="scale-75" />
          <h1 className="text-xl font-semibold text-slate-800">Set Your Password</h1>
          <p className="text-sm text-slate-500 font-medium">Welcome! Please secure your account with a permanent password.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="flex flex-col space-y-4 px-4 py-8 sm:px-12">
          <div>
            <label className="block text-xs text-slate-500 uppercase font-medium mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
