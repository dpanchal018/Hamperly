import { createClient as createServerClient } from "@/lib/supabase/server";
import { Package, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "My Orders | Hamperly",
};

export default async function OrdersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // First fetch the customer record to get the customer.id
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

  // Fetch purchases with items using the customer.id (not auth user.id)
  const { data: purchases } = await supabase
    .from("purchases")
    .select(`
      id,
      purchase_date,
      status,
      final_amount,
      purchase_items (
        id,
        product_name_snapshot,
        category_snapshot,
        quantity,
        line_total
      )
    `)
    .eq("customer_id", customer.id)
    .order("purchase_date", { ascending: false });

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-rose-100 p-3 rounded-full text-rose-600">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900">Order History</h2>
      </div>

      {!purchases || purchases.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">No orders yet</h3>
          <p className="text-slate-500 mb-6">Looks like you haven't made any purchases yet.</p>
          <Link 
            href="/hampers"
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
          >
            Browse Hampers <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {purchases.map((order) => {
            const date = new Date(order.purchase_date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            });

            return (
              <div key={order.id} className="border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-colors">
                {/* Order Header */}
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="font-semibold text-slate-900">{date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total</p>
                    <p className="font-semibold text-slate-900">₹{order.final_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right flex-1 min-w-[120px]">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Order ID</p>
                    <p className="font-mono text-xs text-slate-900">#{order.id.split('-')[0]}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-5">
                  <ul className="divide-y divide-slate-100">
                    {order.purchase_items.map((item: any) => (
                      <li key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8 text-slate-300" strokeWidth={1} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{item.product_name_snapshot}</h4>
                          <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                          {item.category_snapshot && (
                            <span className="inline-block mt-2 text-[10px] font-semibold text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">
                              {item.category_snapshot}
                            </span>
                          )}
                        </div>
                        <div className="text-right font-semibold text-sm text-slate-900">
                          ₹{item.line_total.toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
