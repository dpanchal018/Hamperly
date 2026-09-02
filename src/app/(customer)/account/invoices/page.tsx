import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText, Download, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
export const metadata = {
  title: "My Invoices | Hamperly",
};

export default async function InvoicesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/invoices");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <p>Customer profile not found.</p>
    </div>
  );

  // Fetch only COMPLETED or confirmed orders for invoices
  const { data: purchases } = await supabase
    .from("purchases")
    .select(`
      id,
      purchase_date,
      status,
      payment_status,
      final_amount
    `)
    .eq("customer_id", customer.id)
    .neq("status", "CANCELLED")
    .order("purchase_date", { ascending: false });

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Tax Invoices</h2>
          <p className="text-slate-500 text-sm mt-1">Download and view receipts for your completed orders.</p>
        </div>
      </div>

      {!purchases || purchases.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">No invoices available</h3>
          <p className="text-slate-500 mb-6">You don't have any completed orders yet.</p>
          <Link 
            href="/hampers"
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-emerald-600 transition-colors"
          >
            Browse Hampers <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice No.</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {purchases.map((order) => {
                const date = new Date(order.purchase_date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });
                const invoiceNo = `INV-${order.id.split('-')[0].toUpperCase()}`;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">{date}</td>
                    <td className="py-4 px-4 font-mono text-sm text-slate-600">{invoiceNo}</td>
                    <td className="py-4 px-4 font-semibold text-slate-900">₹{order.final_amount.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        order.payment_status === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/checkout/success/${order.id}`}
                        className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View / Print</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
