import { getCustomerDetails } from '@/actions/customer.actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { User, ArrowLeft, Package, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { EditCustomerModal } from '@/components/admin/EditCustomerModal';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const { customer, error } = await getCustomerDetails(id);

  if (error || !customer) {
    notFound();
  }

  const purchases = customer.purchases || [];
  
  // Calculate lifetime value
  const lifetimeValue = purchases
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + Number(p.final_amount), 0);

  const totalOutstanding = purchases
    .filter((p: any) => p.status !== 'CANCELLED')
    .reduce((sum: number, p: any) => sum + Number(p.amount_due), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/admin/customers-purchases" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Profile</h1>
          <p className="text-slate-500 mt-1">Manage customer details and view purchase history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {customer.full_name.charAt(0).toUpperCase()}
              </div>
              <EditCustomerModal customer={customer} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{customer.full_name}</h2>
            {customer.customer_reference && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                Ref: {customer.customer_reference}
              </span>
            )}
            
            <div className="mt-6 space-y-4">
              {customer.mobile_number && (
                <div className="flex items-start space-x-3 text-slate-600">
                  <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
                  <span className="text-sm">{customer.mobile_number}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-start space-x-3 text-slate-600">
                  <Mail className="w-4 h-4 mt-0.5 text-slate-400" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start space-x-3 text-slate-600">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div className="text-sm">
                    {customer.address && <div className="whitespace-pre-wrap">{customer.address}</div>}
                    {customer.city && <div className="font-medium mt-1">{customer.city}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-indigo-500" />
              Customer Notes
            </h3>
            {customer.notes ? (
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
                {customer.notes}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No notes recorded.</p>
            )}
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{purchases.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Lifetime Value</p>
              <p className="text-2xl font-bold text-emerald-600">₹{lifetimeValue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-amber-600">₹{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-500" />
                Purchase History
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Items</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Payment</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No purchases found for this customer.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((purchase: any) => (
                      <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600 whitespace-nowrap">
                          {new Date(purchase.purchase_date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-600">
                          {purchase.purchase_items?.[0]?.product_name_snapshot}
                          {purchase.purchase_items?.length > 1 && (
                            <span className="text-xs text-slate-400 ml-1">
                              +{purchase.purchase_items.length - 1} more
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          ₹{Number(purchase.final_amount).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            purchase.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                            purchase.payment_status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {purchase.payment_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            purchase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                            purchase.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {purchase.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/admin/customers-purchases/${purchase.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
