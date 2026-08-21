import { getPurchases } from '@/actions/purchase.actions';
import { PackageCheck, FileDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { PurchaseFilters } from '@/components/admin/PurchaseFilters';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomersPurchasesPage({
  searchParams,
}: {
  searchParams: { status?: string, payment_mode?: string, sale_source?: string };
}) {
  const { status, payment_mode, sale_source } = await searchParams;
  const { purchases, error } = await getPurchases({ status: status || undefined, payment_mode: payment_mode || undefined, sale_source: sale_source || undefined });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers & Purchases</h1>
          <p className="text-slate-500 mt-2">Manage customer purchase history and generate reports.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-4 items-center">
          <PurchaseFilters />
          <Link 
            href="/admin/customers-purchases/export" 
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Link>
          <Link 
            href="/admin/customers-purchases/new"
            className="flex items-center px-4 py-2 bg-rose-600 rounded-lg text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error loading purchases: {error}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium">Purchase ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Source</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium">Profit/Loss</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  purchases?.map((purchase: any) => {
                    // Profit = Final Revenue - Original Cost (Ignore if cancelled)
                    const originalCost = purchase.purchase_items?.reduce((sum: number, item: any) => sum + (Number(item.catalog_unit_price) * Number(item.quantity)), 0) || 0;
                    const profit = purchase.status === 'CANCELLED' ? 0 : (Number(purchase.final_amount) - originalCost);

                    return (
                      <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <Link href={`/admin/customers-purchases/${purchase.id}`} className="font-mono text-xs text-rose-600 hover:underline">
                            {purchase.id.split('-')[0]}...
                          </Link>
                        </td>
                        <td className="p-4">
                          <Link href={`/admin/customers-purchases/customer/${purchase.customer_id}`} className="font-medium text-slate-900 hover:text-rose-600">
                            {purchase.customers?.full_name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {purchase.customers?.customer_reference && (
                              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                                {purchase.customers.customer_reference}
                              </span>
                            )}
                            <div className="text-xs text-slate-500">{purchase.customers?.mobile_number}</div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          {new Date(purchase.purchase_date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                            {purchase.sale_source || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-slate-600">
                            {purchase.purchase_items?.length} item(s)
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          ₹{purchase.final_amount.toLocaleString()}
                          {Number(purchase.discount) > 0 && (
                            <div className="text-xs text-red-500 font-normal">Discount: ₹{Number(purchase.discount).toLocaleString()}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 mr-2">
                            {purchase.payment_mode || 'N/A'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            purchase.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                            purchase.payment_status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {purchase.payment_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            purchase.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 
                            purchase.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {purchase.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AutoRefresh intervalMs={10000} />
    </div>
  );
}
