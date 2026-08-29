import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Package, MapPin, Phone, Mail, Calendar, CreditCard, ShoppingBag } from 'lucide-react';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getCurrentUser } from '@/services/auth.service';
import { redirect } from 'next/navigation';
import { PrintInvoiceButton } from '@/components/customer/PrintInvoiceButton';

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();

  // Connect as admin to reliably fetch the order details and invoice items regardless of RLS
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch full purchase with customer & line items
  const { data: purchase, error } = await supabaseAdmin
    .from('purchases')
    .select(`
      *,
      customers (
        id,
        user_id,
        full_name,
        email,
        mobile_number,
        address,
        pincode,
        city
      ),
      purchase_items (
        id,
        product_name_snapshot,
        category_snapshot,
        quantity,
        actual_unit_price,
        line_total
      )
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (error || !purchase) {
    redirect('/');
  }

  // If order is bound to a user_id, ensure the active user matches
  if (purchase.customers?.user_id) {
    if (!user || user.id !== purchase.customers.user_id) {
      redirect('/login');
    }
  }

  const customer = purchase.customers;
  const items = purchase.purchase_items || [];
  
  // Extract address and pincode from customer record or order notes
  let deliveryAddress = customer?.address;
  let deliveryPincode = customer?.pincode;

  if (purchase.notes) {
    const lines = purchase.notes.split('\n');
    for (const line of lines) {
      if (line.startsWith('Delivery:') && !deliveryAddress) {
        deliveryAddress = line.replace('Delivery:', '').trim();
      }
      if (line.startsWith('Pincode:') && !deliveryPincode) {
        deliveryPincode = line.replace('Pincode:', '').trim();
      }
    }
  }

  const orderDate = new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F2FBF6] to-[#F8FAFC] py-8 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Header - Hidden during print */}
      <header className="max-w-4xl mx-auto w-full mb-8 flex items-center justify-between print:hidden">
        <Logo className="scale-90 origin-left" withTagline={false} />
        <Link 
          href="/hampers" 
          className="text-sm font-medium text-slate-600 hover:text-rose-600 flex items-center gap-1 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full space-y-8">
        {/* Success Confirmation Banner - Hidden during print */}
        <div className="bg-white rounded-3xl border border-emerald-100 p-8 shadow-xl shadow-emerald-900/5 text-center print:hidden">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
            Thank you for shopping with us! Your order has been placed successfully. A detailed tax invoice receipt is generated below.
          </p>
        </div>

        {/* Action Bar - Hidden during print */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Order Ref</span>
            <span className="font-mono text-base font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              #{purchase.id.split('-')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrintInvoiceButton />
            {user && (
              <Link 
                href="/account/orders"
                className="inline-flex items-center justify-center px-5 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-colors text-sm"
              >
                View in Account
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Logo className="scale-90 origin-left" withTagline={false} />
              </div>
              <p className="text-xs text-slate-500">Curated Hampers & Luxury Gift Boxes</p>
              <p className="text-xs text-slate-400 mt-1">Vadodara, Gujarat, India</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                Tax Invoice / Order Receipt
              </span>
              <p className="text-sm font-semibold text-slate-900">
                Invoice No: <span className="font-mono">INV-{purchase.id.substring(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {orderDate}
              </p>
              <div className="flex flex-wrap gap-2 sm:justify-end mt-2.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Order: {purchase.status === 'CANCELLED' ? 'CANCELLED' : purchase.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Payment: {purchase.payment_status === 'PAID' ? 'PAID' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100 text-sm">
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Customer Details</h3>
              <p className="font-bold text-slate-900 text-base">{customer?.full_name || 'Guest Customer'}</p>
              {customer?.email && (
                <p className="text-slate-600 flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.email}
                </p>
              )}
              {customer?.mobile_number && (
                <p className="text-slate-600 flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customer.mobile_number}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Delivery Information</h3>
              <div className="text-slate-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="whitespace-pre-wrap">{deliveryAddress || 'Address on file'}</p>
                  {deliveryPincode && (
                    <p className="font-mono text-xs font-semibold text-slate-600 mt-1">Pincode: {deliveryPincode}</p>
                  )}
                  <p className="text-xs text-emerald-600 font-medium mt-1">Standard Delivery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-8 border-b border-slate-100 overflow-x-auto">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">Purchased Items</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Item Description</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900">{item.product_name_snapshot}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.category_snapshot || 'Gift Hamper'}</p>
                    </td>
                    <td className="py-4 px-2 text-center text-slate-700 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-2 text-right text-slate-600">
                      ₹{Number(item.actual_unit_price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 pl-2 text-right font-bold text-slate-900">
                      ₹{Number(item.line_total).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Breakdown & Status */}
          <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                <CreditCard className="w-4 h-4 text-slate-500" />
                Payment & Fulfillment
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-medium text-slate-900">{purchase.payment_mode || 'Cash on Delivery / Offline'}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 items-center">
                <span>Order Status:</span>
                <span className="font-bold px-2.5 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {purchase.status === 'CANCELLED' ? 'CANCELLED' : purchase.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 items-center">
                <span>Payment Status:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded text-[11px] border ${
                  purchase.payment_status === 'PAID' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {purchase.payment_status === 'PAID' ? 'PAID' : 'PENDING'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>₹{Number(purchase.subtotal || purchase.final_amount).toLocaleString('en-IN')}</span>
              </div>
              {Number(purchase.discount) > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{Number(purchase.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping & Packaging</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Total Amount</span>
                <span className="text-2xl font-serif font-bold text-primary">
                  ₹{Number(purchase.final_amount).toLocaleString('en-IN')}
                </span>
              </div>
              {Number(purchase.amount_due) > 0 ? (
                <p className="text-xs text-slate-400 text-right">
                  Balance due on delivery: ₹{Number(purchase.amount_due).toLocaleString('en-IN')}
                </p>
              ) : (
                <p className="text-xs text-emerald-600 font-medium text-right">
                  Payment Complete
                </p>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            <p>Thank you for choosing Hamperly. We hope you love your gift hampers!</p>
            <p className="mt-1">For support or inquiries, please contact us with your order reference.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
