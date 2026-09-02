import React from 'react';
import { getPurchaseDetails } from '@/actions/purchase.actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, Calendar, User, ArrowLeft, Download, FileText, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { CancelOrderButton } from '@/components/admin/CancelOrderButton';
import { RecordPaymentButton } from '@/components/admin/RecordPaymentButton';

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const { purchase, error } = await getPurchaseDetails(id);

  if (error || !purchase) {
    notFound();
  }

  const customer = purchase.customers;
  const items = purchase.purchase_items || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/customers-purchases" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Purchase #{purchase.id.split('-')[0]}</h1>
            <p className="text-slate-500 mt-1">Placed on {new Date(purchase.purchase_date).toLocaleString()}</p>
          </div>
        </div>
        {purchase.status !== 'CANCELLED' && (
          <CancelOrderButton purchaseId={purchase.id} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Customer & Details */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 text-slate-900 font-semibold text-lg pb-3 border-b border-slate-100">
                <User className="w-5 h-5 text-indigo-500" />
                <span>Customer Details</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Name</p>
                <Link href={`/admin/customers-purchases/customer/${customer?.id}`} className="text-slate-900 font-medium hover:text-indigo-600 transition-colors">
                  {customer?.full_name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Contact</p>
                <p className="text-slate-900">{customer?.mobile_number}</p>
                <p className="text-slate-900 text-sm">{customer?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Address</p>
                <p className="text-slate-900 text-sm whitespace-pre-wrap">{customer?.address || 'N/A'}</p>
                <p className="text-slate-900 text-sm">{customer?.city}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 text-slate-900 font-semibold text-lg pb-3 border-b border-slate-100">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>Order Summary</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Sale Source</span>
                <span className="text-sm font-medium text-slate-900">{purchase.sale_source}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  purchase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  purchase.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {purchase.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Payment</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  purchase.status === 'CANCELLED' ? 'bg-slate-100 text-slate-700' :
                  purchase.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                  purchase.payment_status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {purchase.status === 'CANCELLED' 
                    ? (Number(purchase.amount_paid) > 0 ? 'REFUND PENDING' : 'VOIDED') 
                    : purchase.payment_status}
                </span>
              </div>

              {purchase.payment_mode && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Latest Method</span>
                  <span className="text-sm font-medium text-slate-900">{purchase.payment_mode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Logs */}
          {purchase.payment_logs && purchase.payment_logs.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3 text-slate-900 font-semibold text-lg pb-3 border-b border-slate-100">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <span>Payment History</span>
                </div>
                
                <div className="space-y-3">
                  {purchase.payment_logs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className="text-sm font-medium text-slate-900">₹{Number(log.amount).toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{new Date(log.payment_date).toLocaleString()}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {log.payment_mode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Items & Financials */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center space-x-3 text-slate-900 font-semibold text-lg">
              <Package className="w-5 h-5 text-indigo-500" />
              <span>Purchased Items</span>
            </div>
            
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">Item</th>
                  <th className="p-4 font-medium text-right">Original Price</th>
                  <th className="p-4 font-medium text-right">Selling Price</th>
                  <th className="p-4 font-medium text-right">Qty</th>
                  <th className="p-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const groupedItems: Record<string, any[]> = {};
                  const standaloneItems: any[] = [];
                  
                  items.forEach((item: any) => {
                    const match = item.product_name_snapshot.match(/^\[(.*?)\] (.*)$/);
                    if (match) {
                      const groupName = match[1];
                      if (!groupedItems[groupName]) groupedItems[groupName] = [];
                      groupedItems[groupName].push({ ...item, clean_name: match[2] });
                    } else {
                      standaloneItems.push({ ...item, clean_name: item.product_name_snapshot });
                    }
                  });

                  return (
                    <>
                      {Object.entries(groupedItems).map(([groupName, groupItems]) => {
                        const groupTotal = groupItems.reduce((acc, it) => acc + Number(it.line_total), 0);
                        return (
                          <React.Fragment key={`group-${groupName}`}>
                            <tr className="bg-indigo-50/50 border-y border-indigo-100">
                              <td colSpan={4} className="p-4 pl-4 font-bold text-indigo-900">
                                <Package className="w-5 h-5 inline mr-2 text-indigo-500 mb-0.5" />
                                {groupName}
                              </td>
                              <td className="p-4 font-bold text-indigo-900 text-right">
                                ₹{groupTotal.toLocaleString()}
                              </td>
                            </tr>
                            {groupItems.map((item) => (
                              <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="p-4 pl-12 border-l-2 border-indigo-100">
                                  <div className="font-medium text-slate-800">{item.clean_name}</div>
                                  <div className="text-xs text-slate-500">{item.category_snapshot}</div>
                                </td>
                                <td className="p-4 text-slate-500 text-right">
                                  {item.catalog_unit_price ? `₹${Number(item.catalog_unit_price).toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4 text-slate-900 font-medium text-right">₹{Number(item.actual_unit_price).toLocaleString()}</td>
                                <td className="p-4 font-medium text-slate-900 text-right">{item.quantity}</td>
                                <td className="p-4 text-slate-600 font-medium text-right">₹{Number(item.line_total).toLocaleString()}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                      {standaloneItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{item.clean_name}</div>
                            <div className="text-xs text-slate-500">{item.category_snapshot}</div>
                          </td>
                          <td className="p-4 text-slate-500 text-right">
                            {item.catalog_unit_price ? `₹${Number(item.catalog_unit_price).toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-slate-900 font-medium text-right">₹{Number(item.actual_unit_price).toLocaleString()}</td>
                          <td className="p-4 font-medium text-slate-900 text-right">{item.quantity}</td>
                          <td className="p-4 font-medium text-slate-900 text-right">₹{Number(item.line_total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Selling Price)</span>
                <span>₹{Number(purchase.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="text-red-500">- ₹{Number(purchase.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-100">
                <span>Final Amount</span>
                <span>₹{Number(purchase.final_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Amount Paid</span>
                <span>₹{Number(purchase.amount_paid).toLocaleString()}</span>
              </div>
              {Number(purchase.amount_due) > 0 && (
                <>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Balance Due</span>
                    <span>₹{Number(purchase.amount_due).toLocaleString()}</span>
                  </div>
                  {purchase.status !== 'CANCELLED' && (
                    <RecordPaymentButton purchaseId={purchase.id} balanceDue={Number(purchase.amount_due)} />
                  )}
                </>
              )}
              
              {/* Profit Calculation */}
              {(() => {
                const originalCost = items.reduce((sum: number, item: any) => sum + (Number(item.catalog_unit_price) * Number(item.quantity)), 0);
                const profit = purchase.status === 'CANCELLED' ? 0 : (Number(purchase.final_amount) - originalCost);
                return (
                  <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Financial Analysis</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-sm mb-1">
                      <span>Total Original Value</span>
                      <span>₹{originalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-sm">
                      <span>Gross Profit / Loss</span>
                      <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString()}
                      </span>
                    </div>
                    {Number(purchase.discount) > 0 && (
                      <div className="text-xs text-slate-400 mt-1">
                        * Profit accounts for the ₹{Number(purchase.discount).toLocaleString()} discount provided.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {purchase.notes && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 text-indigo-500 mr-2" />
            Order Notes & Cancellation Reasons
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border border-slate-100">
            {purchase.notes}
          </div>
        </div>
      )}
    </div>
  );
}
