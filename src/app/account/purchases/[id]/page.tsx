import { getMyPurchaseDetails } from '@/actions/account.actions';
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
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              purchase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
              purchase.status === 'CANCELLED' ? 'bg-slate-100 text-slate-800' :
              'bg-amber-100 text-amber-800'
            }`}>
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    purchase.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                    purchase.payment_status === 'PARTIALLY PAID' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
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
