import { getMyPurchases } from '@/actions/account.actions';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderAgainButton } from '@/components/customer/OrderAgainButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerHampersPage() {
  const { purchases, error } = await getMyPurchases();
  
  // Extract all unique hampers from purchases
  const purchasedHampers = purchases?.flatMap((p: any) => p.purchase_items).filter(Boolean) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Hampers</h1>
        <p className="text-slate-500 mt-2">Hampers you have designed and purchased.</p>
      </div>

      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-indigo-900">Current Draft</h2>
          <p className="text-indigo-700 mt-1">Continue building the hamper you started.</p>
        </div>
        <Link href="/hampers" className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors">
          Resume Building <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">Error loading hampers: {error}</div>
      ) : purchasedHampers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No purchased hampers</h3>
          <p className="text-slate-500">Your purchased hampers will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasedHampers.map((item: any, i: number) => (
            <div key={item.id || i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="h-48 bg-slate-100 flex items-center justify-center">
                <Package className="w-12 h-12 text-slate-300" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.product_name_snapshot}</h3>
                <div className="mt-auto pt-4 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Qty: {item.quantity}</span>
                  <OrderAgainButton hamperName={item.product_name_snapshot} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
