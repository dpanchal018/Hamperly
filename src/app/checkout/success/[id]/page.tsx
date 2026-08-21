import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireCustomer, getCurrentUser } from '@/services/auth.service';
import { redirect } from 'next/navigation';

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  await requireCustomer();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = await createClient();

  // Verify the order belongs to this customer
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, customers!inner(user_id)')
    .eq('id', resolvedParams.id)
    .eq('customers.user_id', user.id)
    .single();

  if (!purchase) {
    redirect('/account/purchases');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-center">
        <Logo className="scale-75 origin-center" withTagline={false} />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 max-w-xl w-full text-center shadow-xl shadow-slate-200/40">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Order Confirmed!</h1>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-8 text-sm">
            <p className="text-slate-500 mb-1">Order Reference</p>
            <p className="font-mono font-bold text-slate-900 text-lg">#{purchase.id.split('-')[0].toUpperCase()}</p>
          </div>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Thank you for your purchase. Your order has been successfully placed and is currently <span className="font-bold text-amber-600">PENDING</span> confirmation. Our team will contact you shortly to finalize payment and delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/account/purchases/${purchase.id}`}
              className="flex items-center justify-center px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Invoice
            </Link>
            <Link 
              href="/hampers"
              className="flex items-center justify-center px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Continue Shopping
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
