import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, ExternalLink, ArrowRight, Ban } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CancelOrderButton } from "@/components/customer/CancelOrderButton";

export const metadata = {
  title: "My Orders | Hamperly",
};

export default async function OrdersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/orders");
  }

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
                    {(() => {
                      const groupedItems: Record<string, any[]> = {};
                      const standaloneItems: any[] = [];
                      
                      order.purchase_items.forEach((item: any) => {
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
                              <li key={`group-${groupName}`} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex items-start gap-4 mb-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Package className="w-6 h-6 text-indigo-500" strokeWidth={1.5} />
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1">
                                    <h4 className="text-sm font-bold text-indigo-950 line-clamp-2">{groupName}</h4>
                                    <p className="text-[11px] text-indigo-600/80 mt-0.5 font-medium uppercase tracking-wider">Custom Hamper</p>
                                  </div>
                                  <div className="text-right font-bold text-sm text-indigo-950 pt-1">
                                    ₹{groupTotal.toFixed(2)}
                                  </div>
                                </div>
                                <ul className="pl-16 space-y-3">
                                  {groupItems.map((item) => (
                                    <li key={item.id} className="flex justify-between items-start text-sm">
                                      <div className="flex-1 pr-4">
                                        <p className="font-semibold text-slate-800">{item.clean_name}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{item.category_snapshot}</p>
                                      </div>
                                      <div className="text-slate-500 text-xs mt-0.5 mr-6 text-center w-8">
                                        x{item.quantity}
                                      </div>
                                      <div className="text-slate-600 font-medium">
                                        ₹{Number(item.line_total).toFixed(2)}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            );
                          })}
                          {standaloneItems.map((item) => (
                            <li key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package className="w-8 h-8 text-slate-300" strokeWidth={1} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{item.clean_name}</h4>
                                <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                                {item.category_snapshot && (
                                  <span className="inline-block mt-2 text-[10px] font-semibold text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">
                                    {item.category_snapshot}
                                  </span>
                                )}
                              </div>
                              <div className="text-right font-semibold text-sm text-slate-900">
                                ₹{Number(item.line_total).toFixed(2)}
                              </div>
                            </li>
                          ))}
                        </>
                      );
                    })()}
                  </ul>
                  
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                      <CancelOrderButton orderId={order.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
