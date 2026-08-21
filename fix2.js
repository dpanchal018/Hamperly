const fs = require('fs');
const path = require('path');

const purchasesPage = import { getMyPurchases } from '@/actions/account.actions';
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
                    {p.purchase_items?.length > 1 && \ +\ more\}
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
                  <span className={\inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold \\}>
                    {p.status}
                  </span>
                </div>
                
                <Link href={\/account/purchases/\\} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
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
;

const purchaseDetail = import { getMyPurchaseDetails } from '@/actions/account.actions';
import Link from 'next/link';
import { ArrowLeft, Package, Receipt, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CustomerPurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { purchase, error } = await getMyPurchaseDetails(resolvedParams.id);

  if (error || !purchase) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/account/purchases" className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-3">
            <span>Order Details</span>
            <span className={\px-2.5 py-0.5 rounded-full text-xs font-bold \\}>
              {purchase.status}
            </span>
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">Ref: {purchase.id.split('-')[0].toUpperCase()} &bull; {new Date(purchase.purchase_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center">
              <Package className="w-5 h-5 mr-2 text-slate-500" />
              <h2 className="font-bold text-slate-900">Items Ordered</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {purchase.purchase_items?.map((item: any) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.product_name_snapshot}</h3>
                    <p className="text-slate-500 text-sm mt-1">{item.quantity} × ₹{item.actual_unit_price}</p>
                  </div>
                  <div className="font-bold text-slate-900">
                    ₹{item.line_total}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Payment History */}
          {purchase.payment_logs?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-slate-500" />
                <h2 className="font-bold text-slate-900">Payment History</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {purchase.payment_logs.map((log: any) => (
                  <div key={log.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">₹{log.amount}</p>
                      <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {log.payment_mode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-slate-500" />
              <h2 className="font-bold text-slate-900">Order Summary</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-slate-600 text-sm">
                <span>Subtotal</span>
                <span>₹{purchase.subtotal}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-emerald-600 text-sm">
                  <span>Discount</span>
                  <span>-₹{purchase.discount}</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-100 flex justify-between font-bold text-lg text-slate-900">
                <span>Total Amount</span>
                <span>₹{purchase.final_amount}</span>
              </div>
              
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Amount Paid</span>
                  <span className="font-medium text-emerald-600">₹{purchase.amount_paid}</span>
                </div>
                {purchase.amount_due > 0 && (
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Balance Due</span>
                    <span className="text-rose-600">₹{purchase.amount_due}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 text-center">
                <span className={\inline-flex items-center px-3 py-1 rounded-full text-xs font-bold \\}>
                    Payment: {purchase.payment_status}
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
;

fs.writeFileSync(path.join(__dirname, 'src', 'app', 'account', 'purchases', 'page.tsx'), purchasesPage);
fs.writeFileSync(path.join(__dirname, 'src', 'app', 'account', 'purchases', '[id]', 'page.tsx'), purchaseDetail);
