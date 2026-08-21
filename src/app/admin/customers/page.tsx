import { getAllCustomers } from '@/actions/customer.actions';
import { Users, Mail, Phone, Calendar, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { customers } = await getAllCustomers();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers Directory</h1>
          <p className="text-slate-500 mt-2">View and manage all registered customer accounts.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="font-semibold py-4 px-6">Customer Name</th>
                <th className="font-semibold py-4 px-6">Email Address</th>
                <th className="font-semibold py-4 px-6">Phone Number</th>
                <th className="font-semibold py-4 px-6">Password</th>
                <th className="font-semibold py-4 px-6">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!customers?.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                          {customer.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{customer.full_name}</p>
                          <p className="text-xs text-slate-500">{customer.customer_reference || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {customer.email ? (
                        <div className="flex items-center text-slate-600">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          {customer.email}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {customer.mobile_number ? (
                        <div className="flex items-center text-slate-600">
                          <Phone className="w-4 h-4 mr-2 text-slate-400" />
                          {customer.mobile_number}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-slate-600">
                        <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                        <span className="font-mono tracking-widest text-slate-400">********</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {new Date(customer.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', month: 'short', day: 'numeric' 
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
