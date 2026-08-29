'use server'

import { createClient } from '@/lib/supabase/server';
import { sendTelegramMessage } from './telegram.actions';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getCurrentUser } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

// Admin client to bypass RLS for critical checkout operations like stock updates
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
}

export async function placeCustomerOrder(
  cartItems: any[], 
  deliveryAddress?: string, 
  pincode?: string,
  guestDetails?: GuestDetails
) {
  try {
    const user = await getCurrentUser();
    let finalCustomerId = '';
    let finalCustomerName = '';
    let finalCustomerPhone = '';

    
    if (user) {
      const supabase = await createClient(); 
      const { data: customer } = await supabase
        .from('customers')
        .select('id, full_name, mobile_number')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (customer) {
        finalCustomerId = customer.id;
        finalCustomerName = customer.full_name;
        finalCustomerPhone = customer.mobile_number || '';

        const updateData: any = {};
        if (deliveryAddress !== undefined) updateData.address = deliveryAddress;
        if (pincode !== undefined) updateData.pincode = pincode;
        
        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin.from('customers').update(updateData).eq('id', finalCustomerId);
        }
      }
    }
    
    if (!finalCustomerId) {
      if (!guestDetails) throw new Error("Guest details required for unauthenticated checkout");
      
      const { data: existingGuest } = await supabaseAdmin
        .from('customers')
        .select('id, full_name, mobile_number')
        .eq('email', guestDetails.email)
        .limit(1)
        .maybeSingle();
        
      if (existingGuest) {
        finalCustomerId = existingGuest.id;
        finalCustomerName = existingGuest.full_name;
        finalCustomerPhone = existingGuest.mobile_number || '';
        
        const updateData: any = {};
        if (deliveryAddress !== undefined) updateData.address = deliveryAddress;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin.from('customers').update(updateData).eq('id', finalCustomerId);
        }
      } else {
        const guestRef = 'GST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newGuest, error: createError } = await supabaseAdmin
          .from('customers')
          .insert({
            customer_reference: guestRef,
            full_name: guestDetails.fullName,
            email: guestDetails.email,
            mobile_number: guestDetails.phone,
            address: deliveryAddress,
            pincode: pincode,
            is_active: true,
            user_id: null // Never link user_id here to avoid UNIQUE constraint violations if Admins test multiple guest emails
          })
          .select('id')
          .single();
          
        if (createError || !newGuest) throw new Error("Failed to create guest profile");
        finalCustomerId = newGuest.id;
        finalCustomerName = guestDetails.fullName;
        finalCustomerPhone = guestDetails.phone;
      }
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const hamperItems = cartItems.filter(i => i.itemType !== 'PRODUCT');
    const productItems = cartItems.filter(i => i.itemType === 'PRODUCT');
    
    const hamperIds = hamperItems.map(item => item.id);
    const productIds = productItems.map(item => item.id);

    let dbHampers: any[] = [];
    if (hamperIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('hampers')
        .select('id, name, selling_price, actual_cost, stock_quantity')
        .in('id', hamperIds);
      if (error) throw new Error("Failed to validate hampers");
      dbHampers = data || [];
    }

    let dbProducts: any[] = [];
    if (productIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, name, selling_price, actual_cost, stock_quantity, category:categories(name)')
        .in('id', productIds);
      if (error) throw new Error("Failed to validate products");
      dbProducts = data || [];
    }

    for (const item of cartItems) {
      const dbItem = item.itemType === 'PRODUCT' 
        ? dbProducts.find(p => p.id === item.id) 
        : dbHampers.find(h => h.id === item.id);
      
      if (!dbItem) throw new Error(`${item.name} is no longer available`);
      if (dbItem.stock_quantity !== null && dbItem.stock_quantity < item.quantity) {
        const itemTypeLabel = item.itemType === 'PRODUCT' ? 'Product' : 'Hamper';
        const customerInfo = finalCustomerName ? `${finalCustomerName}${finalCustomerPhone ? ` (${finalCustomerPhone})` : ''}` : 'Customer';
        
        try {
          const outOfStockMsg = `
🚨 <b>IMMEDIATE STOCK REQUIRED!</b> 🚨
<b>Item:</b> ${dbItem.name} (${itemTypeLabel})
<b>Attempted Order Qty:</b> ${item.quantity}
<b>Current Stock:</b> ${dbItem.stock_quantity}
<b>Customer:</b> ${customerInfo}

⚠️ <i>A customer tried to place an order, but this item went out of stock due to a recent purchase. Immediate inventory replenishment required!</i>
          `.trim();
          await sendTelegramMessage(outOfStockMsg, 'ALERT');
        } catch (tgErr) {
          console.error("Failed to send out of stock attempt alert:", tgErr);
        }

        if (dbItem.stock_quantity <= 0) {
          throw new Error(`"${dbItem.name}" is now out of stock! Another customer just purchased the remaining inventory. Please remove it from your cart to proceed.`);
        } else {
          throw new Error(`Only ${dbItem.stock_quantity} unit(s) of "${dbItem.name}" are currently available. Please adjust your cart quantity to proceed.`);
        }
      }
    }

    let subtotal = 0;
    const purchaseItems = [];
    let totalCost = 0;

    for (const item of cartItems) {
      const dbItem = item.itemType === 'PRODUCT' 
        ? dbProducts.find(p => p.id === item.id) 
        : dbHampers.find(h => h.id === item.id);
        
      const lineTotal = dbItem.selling_price * item.quantity;
      const lineCost = (dbItem.actual_cost || 0) * item.quantity;
      subtotal += lineTotal;
      totalCost += lineCost;

      purchaseItems.push({
        product_id: item.itemType === 'PRODUCT' ? item.id : null,
        product_name_snapshot: dbItem.name,
        category_snapshot: item.itemType === 'PRODUCT' ? (dbItem.category as any)?.name || 'Uncategorized' : 'Pre-packaged Hamper',
        quantity: item.quantity,
        catalog_unit_price: dbItem.actual_cost || 0,
        actual_unit_price: dbItem.selling_price,
        line_total: lineTotal
      });
    }

    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert({
        customer_id: finalCustomerId,
        subtotal: subtotal,
        final_amount: subtotal,
        amount_due: subtotal,
        amount_paid: 0,
        status: 'CONFIRMED',
        payment_status: 'PENDING',
        sale_source: 'WEBSITE',
        notes: `Delivery: ${deliveryAddress || 'N/A'}\nPincode: ${pincode || 'N/A'}`,
        purchase_date: new Date().toISOString()
      })
      .select('id, status, payment_status')
      .single();

    if (purchaseError || !purchase) {
      console.error("Purchase insert error:", purchaseError);
      throw new Error("Failed to create order record");
    }

    const itemsWithPurchaseId = purchaseItems.map(item => ({
      ...item,
      purchase_id: purchase.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('purchase_items')
      .insert(itemsWithPurchaseId);

    if (itemsError) {
      console.error("Items insert error:", itemsError);
      await supabaseAdmin.from('purchases').delete().eq('id', purchase.id);
      throw new Error("Failed to save order items");
    }

    for (const item of cartItems) {
      const table = item.itemType === 'PRODUCT' ? 'products' : 'hampers';
      const dbItem = item.itemType === 'PRODUCT' 
        ? dbProducts.find(p => p.id === item.id) 
        : dbHampers.find(h => h.id === item.id);
        
      if (dbItem.stock_quantity !== null) {
        const newStock = Math.max(0, dbItem.stock_quantity - item.quantity);
        await supabaseAdmin.from(table).update({ stock_quantity: newStock }).eq('id', item.id);
      }
    }

    // Try to notify admin
    try {
      const orderShortId = purchase.id.split('-')[0].toUpperCase();
      
      let itemsList = '';
      purchaseItems.forEach(item => {
        itemsList += `- ${item.quantity}x ${item.product_name_snapshot}\n`;
      });

      const customerPhoneDisplay = finalCustomerPhone ? ` (${finalCustomerPhone})` : ' (No Phone)';

      const telegramMessage = `
🚨 <b>NEW ORDER RECEIVED!</b> 🚨
<b>Order ID:</b> #${orderShortId}
<b>Customer:</b> ${finalCustomerName}${customerPhoneDisplay}
<b>Amount:</b> ₹${subtotal}
<b>Order Status:</b> ${purchase.status || 'CONFIRMED'}
<b>Payment Status:</b> ${purchase.payment_status || 'PENDING'}

<b>Items Ordered:</b>
${itemsList.trim()}

Please check the Admin Portal for details.
      `.trim();

      await sendTelegramMessage(telegramMessage, 'ALERT');
    } catch (e) {
      console.error("Telegram notification failed", e);
    }
    
    // Create in-app notification
    try {
      await supabaseAdmin.from('notifications').insert({
        customer_id: finalCustomerId,
        purchase_id: purchase.id,
        type: 'ORDER_PLACED',
        title: 'Order Confirmed! \uD83C\uDF89',
        message: `Your order #${purchase.id.split('-')[0]} for \u20B9${subtotal.toLocaleString()} has been placed successfully.`,
        is_read: false
      });
    } catch (e) {
      console.error("In-app notification failed", e);
    }

    if (user) {
      await supabaseAdmin.from('customers').update({ cart_state: [] }).eq('user_id', user.id);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/customers-purchases');
    revalidatePath('/admin/products');
    revalidatePath('/admin/hampers');
    revalidatePath('/account/orders');

    return { success: true, purchaseId: purchase.id };

  } catch (error: any) {
    console.error("Order error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
