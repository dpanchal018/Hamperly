'use server';

import { createClient } from '@/lib/supabase/server';
import { sendTelegramMessage } from './telegram.actions';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getCurrentUser } from '@/services/auth.service';
import { getPublicCustomizations } from './customization.actions';
import { revalidatePath } from 'next/cache';

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
            user_id: null
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

    // Separate items by type
    const personalizedHampers = cartItems.filter(i => i.itemType === 'PERSONALIZED_HAMPER');
    const premadeHampers = cartItems.filter(i => i.itemType === 'HAMPER' || (!i.itemType && !i.products));
    const standaloneProducts = cartItems.filter(i => i.itemType === 'PRODUCT');

    // 1. Gather all product IDs needed from DB
    const allProductIds = new Set<string>();
    standaloneProducts.forEach(p => allProductIds.add(p.id));
    personalizedHampers.forEach(h => {
      if (Array.isArray(h.products)) {
        h.products.forEach((p: any) => allProductIds.add(p.id));
      }
    });

    const premadeHamperIds = premadeHampers.map(h => h.id);

    // 2. Fetch authoritative records from DB
    let dbProducts: any[] = [];
    if (allProductIds.size > 0) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, name, selling_price, stock_quantity, status, category:categories(name)')
        .in('id', Array.from(allProductIds));
      if (error) {
        console.error('Failed to validate products:', error);
        throw new Error("Failed to validate products");
      }
      dbProducts = data || [];
    }

    let dbHampers: any[] = [];
    if (premadeHamperIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('hampers')
        .select('id, name, selling_price, actual_cost, stock_quantity, is_active')
        .in('id', premadeHamperIds);
      if (error) throw new Error("Failed to validate pre-made hampers");
      dbHampers = data || [];
    }

    // Fetch active customizations for authoritative price lookup
    const activeCustomizationCategories = await getPublicCustomizations();
    const customizationOptionPriceMap = new Map<string, number>();
    activeCustomizationCategories.forEach(cat => {
      (cat.options || []).forEach(opt => {
        customizationOptionPriceMap.set(opt.id, Number(opt.price) || 0);
      });
    });

    // 3. Aggregate product inventory demands to verify stock
    const productStockDemand = new Map<string, number>();

    standaloneProducts.forEach(item => {
      const current = productStockDemand.get(item.id) || 0;
      productStockDemand.set(item.id, current + item.quantity);
    });

    personalizedHampers.forEach(item => {
      const hamperQty = item.quantity || 1;
      (item.products || []).forEach((p: any) => {
        const current = productStockDemand.get(p.id) || 0;
        productStockDemand.set(p.id, current + (p.quantity * hamperQty));
      });
    });

    // Verify product stocks
    for (const [prodId, requiredQty] of productStockDemand.entries()) {
      const dbProd = dbProducts.find(p => p.id === prodId);
      if (!dbProd) throw new Error("A selected product is no longer available in the catalog.");
      if (dbProd.status !== 'active') throw new Error(`"${dbProd.name}" is no longer active.`);
      if (dbProd.stock_quantity !== null && dbProd.stock_quantity < requiredQty) {
        throw new Error(
          dbProd.stock_quantity <= 0
            ? `"${dbProd.name}" is now out of stock! Please update your cart.`
            : `Only ${dbProd.stock_quantity} unit(s) of "${dbProd.name}" are currently available.`
        );
      }
    }

    // Verify pre-made hampers stock
    for (const item of premadeHampers) {
      const dbHamp = dbHampers.find(h => h.id === item.id);
      if (!dbHamp) throw new Error(`${item.name} is no longer available.`);
      if (dbHamp.stock_quantity !== null && dbHamp.stock_quantity < item.quantity) {
        throw new Error(
          dbHamp.stock_quantity <= 0
            ? `"${dbHamp.name}" is now out of stock!`
            : `Only ${dbHamp.stock_quantity} unit(s) of "${dbHamp.name}" are currently available.`
        );
      }
    }

    // 4. Construct authoritative line items & snapshots
    let grandSubtotal = 0;
    const purchaseItems = [];
    const notesSections: string[] = [];

    // Process Standalone Products
    for (const item of standaloneProducts) {
      const dbProd = dbProducts.find(p => p.id === item.id);
      const unitPrice = Number(dbProd.selling_price) || 0;
      const lineTotal = unitPrice * item.quantity;
      grandSubtotal += lineTotal;

      purchaseItems.push({
        product_id: dbProd.id,
        product_name_snapshot: dbProd.name,
        category_snapshot: (dbProd.category as any)?.name || 'Product',
        quantity: item.quantity,
        catalog_unit_price: Number(dbProd.selling_price) || 0,
        actual_unit_price: unitPrice,
        line_total: lineTotal
      });
    }

    // Process Pre-made Hampers
    for (const item of premadeHampers) {
      const dbHamp = dbHampers.find(h => h.id === item.id);
      const unitPrice = Number(dbHamp.selling_price) || 0;
      const lineTotal = unitPrice * item.quantity;
      grandSubtotal += lineTotal;

      purchaseItems.push({
        product_id: null,
        product_name_snapshot: dbHamp.name,
        category_snapshot: 'Pre-made Hamper',
        quantity: item.quantity,
        catalog_unit_price: Number(dbHamp.actual_cost) || 0,
        actual_unit_price: unitPrice,
        line_total: lineTotal
      });
    }

    // Process Personalized Hampers
    for (const [hIdx, item] of personalizedHampers.entries()) {
      const hamperQty = item.quantity || 1;
      const hamperPrefix = personalizedHampers.length > 1 ? `[Hamper #${hIdx + 1}: ${item.name}]` : `[${item.name}]`;

      let thisHamperUnitProductsTotal = 0;
      let thisHamperUnitCustomizationsTotal = 0;

      // Products in this hamper
      for (const p of (item.products || [])) {
        const dbProd = dbProducts.find(prod => prod.id === p.id);
        const unitPrice = Number(dbProd.selling_price) || 0;
        const totalProductQty = p.quantity * hamperQty;
        const lineTotal = unitPrice * totalProductQty;

        thisHamperUnitProductsTotal += unitPrice * p.quantity;
        grandSubtotal += lineTotal;

        purchaseItems.push({
          product_id: dbProd.id,
          product_name_snapshot: `${hamperPrefix} ${dbProd.name}`,
          category_snapshot: (dbProd.category as any)?.name || 'Hamper Item',
          quantity: totalProductQty,
          catalog_unit_price: Number(dbProd.selling_price) || 0,
          actual_unit_price: unitPrice,
          line_total: lineTotal
        });
      }

      // Customizations in this hamper
      for (const c of (item.customizations || [])) {
        const optPrice = customizationOptionPriceMap.has(c.optionId)
          ? customizationOptionPriceMap.get(c.optionId)!
          : Number(c.price) || 0;

        const lineTotal = optPrice * hamperQty;
        thisHamperUnitCustomizationsTotal += optPrice;
        grandSubtotal += lineTotal;

        purchaseItems.push({
          product_id: null,
          product_name_snapshot: `${hamperPrefix} Customization: ${c.categoryName} — ${c.optionName}`,
          category_snapshot: 'Customization',
          quantity: hamperQty,
          catalog_unit_price: 0,
          actual_unit_price: optPrice,
          line_total: lineTotal
        });
      }

      // Record notes for this hamper
      let hamperNotes = `${hamperPrefix}\nOccasion: ${item.occasion?.name || 'General'}`;
      if (item.recipient) hamperNotes += `\nRecipient: ${item.recipient}`;
      if (item.personalMessage) hamperNotes += `\nGift Message: "${item.personalMessage}"`;
      notesSections.push(hamperNotes);
    }

    const orderNotes = [
      `Delivery Address: ${deliveryAddress || 'N/A'}`,
      `Pincode: ${pincode || 'N/A'}`,
      ...notesSections
    ].join('\n\n');

    // 5. Create Purchase Record
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert({
        customer_id: finalCustomerId,
        subtotal: grandSubtotal,
        final_amount: grandSubtotal,
        amount_due: grandSubtotal,
        amount_paid: 0,
        status: 'PENDING',
        payment_status: 'PENDING',
        sale_source: 'WEBSITE',
        notes: orderNotes,
        purchase_date: new Date().toISOString()
      })
      .select('id, status, payment_status')
      .single();

    if (purchaseError || !purchase) {
      console.error("Purchase insert error:", purchaseError);
      throw new Error("Failed to create order record.");
    }

    // 6. Insert Purchase Items
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
      throw new Error("Failed to save order items.");
    }

    // 7. Authoritatively Deduct Inventory
    for (const [prodId, requiredQty] of productStockDemand.entries()) {
      const dbProd = dbProducts.find(p => p.id === prodId);
      if (dbProd && dbProd.stock_quantity !== null) {
        const newStock = Math.max(0, dbProd.stock_quantity - requiredQty);
        await supabaseAdmin.from('products').update({ stock_quantity: newStock }).eq('id', prodId);
      }
    }

    for (const item of premadeHampers) {
      const dbHamp = dbHampers.find(h => h.id === item.id);
      if (dbHamp && dbHamp.stock_quantity !== null) {
        const newStock = Math.max(0, dbHamp.stock_quantity - item.quantity);
        await supabaseAdmin.from('hampers').update({ stock_quantity: newStock }).eq('id', item.id);
      }
    }

    // 8. Dispatch Telegram Notification
    try {
      const customerInfo = finalCustomerName ? `${finalCustomerName}${finalCustomerPhone ? ` (${finalCustomerPhone})` : ''}` : 'Storefront Customer';
      const itemsList = purchaseItems
        .map(i => `• <b>${i.product_name_snapshot}</b> × ${i.quantity} — ₹${i.line_total.toFixed(2)}`)
        .join('\n');

      const tgMsg = `
🛍️ <b>NEW ORDER CONFIRMED!</b>
<b>Order ID:</b> #${purchase.id.split('-')[0]}
<b>Customer:</b> ${customerInfo}
<b>Total Amount:</b> ₹${grandSubtotal.toFixed(2)}
<b>Delivery Pincode:</b> ${pincode || 'N/A'}

<b>Order Contents:</b>
${itemsList}
      `.trim();

      await sendTelegramMessage(tgMsg, 'ORDER');
    } catch (tgErr) {
      console.error("Telegram notification error:", tgErr);
    }

    revalidatePath('/admin/customers-purchases');
    revalidatePath('/account/orders');

    return {
      success: true,
      purchaseId: purchase.id
    };
  } catch (error: any) {
    console.error("placeCustomerOrder error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred while placing your order."
    };
  }
}
