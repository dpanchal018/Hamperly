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
      .single();
    customer = data;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-primary/10 py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-primary/5">
        <Link href="/hampers" className="text-foreground/60 hover:text-primary flex items-center text-sm font-semibold transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" strokeWidth={2} />
          Back to Store
        </Link>
        <Link href="/" className="inline-block group">
           <div className="bg-white border border-primary/20 shadow-sm shadow-primary/5 rounded-full px-6 py-2 transition-transform group-hover:scale-105">
              <h2 className="text-3xl font-script text-primary leading-none pt-1">Hamperly</h2>
           </div>
        </Link>
        <div className="w-32"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Checkout</h1>
          <p className="text-foreground/70 mt-3 font-light text-lg">Review your curated gifts and finalize your order.</p>
        </div>

        <CheckoutForm customer={customer} />
      </main>
    </div>
  );
}
