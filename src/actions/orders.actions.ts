'use server';

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getCurrentUser } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function cancelCustomerOrder(purchaseId: string, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Get order to verify ownership and current status
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .select('*, customers!inner(user_id), purchase_items(*)')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      throw new Error("Order not found");
    }

    if (purchase.customers.user_id !== user.id) {
      throw new Error("Unauthorized");
    }

    if (purchase.status === 'CANCELLED' || purchase.status === 'COMPLETED') {
      throw new Error("This order cannot be cancelled");
    }

    // Prepare new notes
    const cancelNote = `[CANCELLED BY CUSTOMER] Reason: ${reason}`;
    const newNotes = purchase.notes ? `${purchase.notes}\n\n${cancelNote}` : cancelNote;

    // Update the purchase status and notes
    const { error: updateError } = await supabaseAdmin
      .from('purchases')
      .update({
        status: 'CANCELLED',
        notes: newNotes
      })
      .eq('id', purchaseId);

    if (updateError) throw new Error("Failed to cancel order");

    // Restock inventory based on purchase_items
    const items = purchase.purchase_items || [];
    
    // Product restocking
    for (const item of items) {
      if (item.product_id) {
        // Fetch current stock
        const { data: prod } = await supabaseAdmin.from('products').select('stock_quantity').eq('id', item.product_id).single();
        if (prod && prod.stock_quantity !== null) {
          await supabaseAdmin.from('products').update({ stock_quantity: prod.stock_quantity + item.quantity }).eq('id', item.product_id);
        }
      } else if (item.category_snapshot === 'Pre-made Hamper') {
        // Pre-made hamper restocking
        const { data: hamp } = await supabaseAdmin.from('hampers').select('id, stock_quantity').eq('name', item.product_name_snapshot).maybeSingle();
        if (hamp && hamp.stock_quantity !== null) {
          await supabaseAdmin.from('hampers').update({ stock_quantity: hamp.stock_quantity + item.quantity }).eq('id', hamp.id);
        }
      }
    }

    // Dispatch a Telegram notification
    try {
      const { sendTelegramMessage } = await import('./telegram.actions');
      const tgMsg = `
🚫 <b>ORDER CANCELLED BY CUSTOMER</b>
<b>Order ID:</b> #${purchase.id.split('-')[0]}
<b>Amount:</b> ₹${purchase.final_amount.toFixed(2)}
<b>Reason:</b> ${reason}
      `.trim();
      await sendTelegramMessage(tgMsg, 'ALERT');
    } catch (e) {
      console.error("Failed to send telegram alert for cancellation", e);
    }

    revalidatePath('/account/orders');
    revalidatePath('/admin/customers-purchases');

    return { success: true };
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return { success: false, error: error.message };
  }
}
