import { getMyProfile, getMyPurchases } from '@/actions/account.actions';
import { Package, Receipt, IndianRupee, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountOverviewPage() {
  const { customer } = await getMyProfile();
  const { purchases } = await getMyPurchases();

  if (!customer) return null;

  const validPurchases = purchases?.filter((p: any) => p.status !== 'CANCELLED') || [];
  const totalSpent = validPurchases.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0);
  const totalOutstanding = validPurchases.reduce((sum: number, p: any) => sum + Number(p.amount_due), 0);
  const recentPurchase = purchases?.[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {customer.full_name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-2">Manage your hampers, view your purchase history, and update your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700">Total Orders</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{purchases?.length || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700">Total Spent</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{totalSpent.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700">Outstanding Balance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {recentPurchase && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-rose-500" />
              Recent Purchase
            </h2>
            <Link href={`/account/purchases/${recentPurchase.id}`} className="text-sm font-medium text-rose-600 hover:underline">
              View Details &rarr;
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Date</p>
              <p className="font-medium text-slate-900">{new Date(recentPurchase.purchase_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Items</p>
              <p className="font-medium text-slate-900">
                {recentPurchase.purchase_items?.[0]?.product_name_snapshot}
                {recentPurchase.purchase_items?.length > 1 && ` +${recentPurchase.purchase_items.length - 1} more`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Amount</p>
              <p className="font-medium text-slate-900">₹{recentPurchase.final_amount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                recentPurchase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                recentPurchase.status === 'CANCELLED' ? 'bg-slate-100 text-slate-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {recentPurchase.status}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link href="/hampers" className="inline-flex h-11 items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-8 text-base font-medium transition-colors">Shop Hampers</Link>
        <Link href="/account/purchases" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 text-base font-medium transition-colors">View All Purchases</Link>
      </div>
    </div>
  );
}
