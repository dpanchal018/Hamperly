'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast, Toaster } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { setupAdminProfile } from '@/actions/users.actions';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if there is an error in the hash fragment (e.g., otp_expired)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      
      // Force set session if access_token is present in the hash
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
            if (error) {
              console.error("Failed to set session from hash:", error);
            }
          });
        }
      }

      if (hash && hash.includes('error=')) {
        setErrorMsg('The invitation link is invalid or has expired. Please ask for a new invite.');
      }
    }
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please retype them carefully.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);

    // 1. Get the current user email before the session is revoked
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email) {
      setErrorMsg('Session expired. Please copy the fresh invite link from the admin portal and paste it here.');
      setLoading(false);
      return;
    }
    
    // 2. Sync the name and password securely via server action
    const res = await setupAdminProfile(fullName, password);
    
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update account');
      setLoading(false);
    } else {
      // 3. Immediately sign back in with the fresh password to restore the session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: password
      });

      if (signInError) {
        // Fallback: If auto-login fails, send them to login page
        setSuccessMsg('Account completed! Redirecting to login...');
        router.push('/login');
        return;
      }

      setSuccessMsg('Account setup complete! Redirecting...');
      
      // 4. Check role to redirect appropriately
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();
        
      if (roleData?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <Toaster position="top-right" />
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-rose-50/30 px-4 py-8 pt-10 text-center sm:px-16">
          <Logo className="scale-75" />
          <h1 className="text-xl font-semibold text-slate-800">Complete Your Account</h1>
          <p className="text-sm text-slate-500 font-medium">Welcome! Please set your name and secure your account with a permanent password.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="flex flex-col space-y-4 px-4 py-8 sm:px-12">
          {errorMsg && (
            <div className="p-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
              {successMsg}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 uppercase font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="off"
              data-1p-ignore
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase font-medium mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              data-1p-ignore
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              data-1p-ignore
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}