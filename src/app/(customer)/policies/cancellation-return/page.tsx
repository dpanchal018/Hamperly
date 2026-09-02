import React from 'react';

export const metadata = {
  title: 'Cancellation & Return Policy | Hamperly',
};

export default function CancellationReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6">Cancellation & Return Policy</h1>
        
        <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
          <p className="lead text-lg text-slate-700 font-medium mb-8">
            At Hamperly, we take pride in curating high-quality gift hampers. We understand that sometimes plans change, and you may need to cancel or return your order. Please read our policy below carefully.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Order Cancellations</h2>
          <p>
            We strive to process and dispatch your orders as quickly as possible. As such, the cancellation window is limited depending on the status of your order:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>
              <strong>Pending & Confirmed Orders:</strong> You can cancel your order directly from your <a href="/account/orders" className="text-primary hover:underline">My Orders</a> dashboard as long as the status is marked as <strong>PENDING</strong> or <strong>CONFIRMED</strong>. 
            </li>
            <li>
              <strong>Custom & Personalized Hampers:</strong> If you have placed an order for a custom hamper that requires personalized engraving, custom ribbons, or special sourcing, cancellations are only accepted within <strong>12 hours</strong> of placing the order.
            </li>
            <li>
              <strong>Completed Orders:</strong> Once an order is marked as <strong>COMPLETED</strong> (dispatched for delivery), it can no longer be cancelled.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Refunds on Cancellations</h2>
          <p>
            If your order is successfully cancelled before dispatch, we will initiate a full refund. 
            The refund will be processed back to the original method of payment within <strong>5-7 business days</strong> depending on your bank or payment provider.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Returns & Replacements</h2>
          <p>
            Due to the perishable and personalized nature of many items inside our hampers (chocolates, custom artifacts, fresh flowers), we generally do not accept returns. However, we will gladly offer a replacement or refund under the following conditions:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>The hamper arrived significantly damaged or physically compromised.</li>
            <li>Items inside the hamper were missing or incorrect compared to your invoice.</li>
            <li>Perishable items were spoiled upon delivery.</li>
          </ul>
          <p>
            To request a return or replacement, please contact our support team at <strong>support@hamperly.com</strong> within <strong>24 hours</strong> of receiving the delivery, and include clear photographs of the damage.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Non-Returnable Items</h2>
          <p>
            Please note that the following items are strictly non-returnable:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Gift cards and e-vouchers</li>
            <li>Items that have been personalized with names, dates, or custom messages</li>
            <li>Perishable goods (e.g., cakes, fresh fruits, specific baked goods) after they have been successfully delivered intact</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Need Help?</h2>
          <p>
            If you have any questions or require assistance with cancelling an order, our customer support team is always here to help. You can reach us at:
          </p>
          <ul className="list-none pl-0 mb-6 space-y-2">
            <li><strong>Email:</strong> support@hamperly.com</li>
            <li><strong>Phone:</strong> +91 98765 43210 (Mon-Sat, 9AM - 6PM IST)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
