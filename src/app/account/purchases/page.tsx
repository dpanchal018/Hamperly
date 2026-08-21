import { getMyPurchases } from '@/actions/account.actions';
import Link from 'next/link';
import { Package, Receipt } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerPurchasesPage() {
  const { purchases, error } = await getMyPurchases();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Purchase History</h1>
        <p className="text-slate-500 mt-2">View all your past orders and their current status.</p>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">Error loading purchases: {error}</div>
      ) : purchases?.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No purchases yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm text-center">You haven't ordered any hampers yet. When you do, they will appear here.</p>
          <Link href="/hampers" className="px-6 py-2 bg-rose-600 text-white font-medium rounded-full hover:bg-rose-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases?.map((p: any) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 transition-colors">
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl hidden sm:block">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {p.purchase_items?.[0]?.product_name_snapshot}
                    {p.purchase_items?.length > 1 && ` +${p.purchase_items.length - 1} more`}
                  </h3>
                  <div className="text-sm text-slate-500 mt-1 space-x-2">
                    <span>{new Date(p.purchase_date).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-xs">ID: {p.id.split('-')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-500 uppercase font-medium mb-1">Amount</p>
                  <p className="font-bold text-slate-900 text-lg">₹{p.final_amount}</p>
                </div>
                
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-500 uppercase font-medium mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'CANCELLED' ? 'bg-slate-100 text-slate-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                
                <Link href={`/account/purchases/${p.id}`} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                  View Details
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
