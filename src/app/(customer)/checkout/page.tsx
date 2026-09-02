import { redirect } from 'next/navigation';
import { getCurrentUserRole, getCurrentUser } from '@/services/auth.service';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/components/customer/CheckoutForm';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const role = user ? await getCurrentUserRole() : null;
  
  let customer = null;
  if (user && role === 'CUSTOMER') {
    const supabase = await createClient();
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    customer = data;
  }

  return (
    <div className="w-full">
      <main className="max-w-6xl w-full mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900">Checkout</h1>
          <p className="text-slate-600 mt-3 font-medium text-lg">Review your curated gifts and finalize your order.</p>
        </div>

        <CheckoutForm customer={customer} />
      </main>
    </div>
  );
}
