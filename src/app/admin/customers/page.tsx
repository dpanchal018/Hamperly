import { getAllCustomers } from '@/actions/customer.actions';
import { getAdminCustomerWishlists } from '@/actions/wishlist.actions';
import { Users, Mail, Phone, Lock, Calendar, Heart } from 'lucide-react';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { BroadcastButton } from '@/components/admin/BroadcastButton';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { customers } = await getAllCustomers();
  const userWishlists = await getAdminCustomerWishlists();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <AutoRefresh intervalMs={10000} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers Directory</h1>
          <p className="text-slate-500 mt-2">View and manage all registered customer accounts.</p>
        </div>
        <BroadcastButton />
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="font-semibold py-4 px-6">Customer Name</th>
                <th className="font-semibold py-4 px-6">Contact Info</th>
                <th className="font-semibold py-4 px-6">Wishlisted Items</th>
                <th className="font-semibold py-4 px-6">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!customers?.length ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const savedItems = userWishlists[customer.user_id] || [];
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                            {customer.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{customer.full_name}</p>
                            <p className="text-xs text-slate-500">{customer.customer_reference || 'Guest'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center text-slate-600">
                              <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              {customer.email}
                            </div>
                          )}
                          {customer.mobile_number && (
                            <div className="flex items-center text-slate-600">
                              <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              {customer.mobile_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {savedItems.length > 0 ? (
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold w-fit mb-1">
                              <Heart className="w-3 h-3 mr-1 fill-rose-600" /> {savedItems.length} Saved
                            </span>
                            <div className="text-xs text-slate-500 line-clamp-2 max-w-[200px]">
                              {savedItems.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-xs">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-slate-500">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
