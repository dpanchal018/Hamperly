import { redirect } from 'next/navigation';
import { getCurrentUserRole, getCurrentUser } from '@/services/auth.service';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/components/customer/CheckoutForm';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?error=Login+to+Proceed');
  
  const role = await getCurrentUserRole();
  if (role !== 'CUSTOMER') {
    redirect('/login?error=Please+login+with+a+customer+account+to+checkout');
  }
  
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!customer) {
    redirect('/account/profile');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between">
        <Link href="/hampers" className="text-slate-500 hover:text-slate-900 flex items-center text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Store
        </Link>
        <Logo className="scale-75 origin-center" withTagline={false} />
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Checkout</h1>
          <p className="text-slate-500 mt-2">Review your order and finalize your purchase.</p>
        </div>

        <CheckoutForm customer={customer} />
      </main>
    </div>
  );
}
