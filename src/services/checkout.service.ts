import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import { getPublicCustomizations } from '@/actions/customization.actions';
import { sendTelegramMessage } from '@/actions/telegram.actions';
import { validatePhoneNumber } from '@/lib/phone';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const QA_EMAIL = 'qa-crawler@hamperly.com';

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface PurchaseItemSnapshot {
  product_id: string | null;
  product_name_snapshot: string;
  category_snapshot: string;
  quantity: number;
  catalog_unit_price: number;
  actual_unit_price: number;
  line_total: number;
}

/** Everything needed to create the purchase once payment succeeds, priced at checkout time */
export interface OrderSnapshot {
  subtotal: number;
  purchaseItems: PurchaseItemSnapshot[];
  orderNotes: string;
  pincode: string | null;
  productDemand: Record<string, number>;
  hamperDemand: Record<string, number>;
  customerName: string;
  customerPhone: string;
  isQATest: boolean;
}

export interface PreparedOrder {
  customer: { id: string; name: string; email: string | null; phone: string };
  snapshot: OrderSnapshot;
}

async function resolveCustomer(
  deliveryAddress: string | undefined,
  pincode: string | undefined,
  guestDetails: GuestDetails | undefined,
  contactPhone: string | undefined
) {
  const user = await getCurrentUser();
  const addressUpdate: Record<string, string> = {};
  if (deliveryAddress !== undefined) addressUpdate.address = deliveryAddress;
  if (pincode !== undefined) addressUpdate.pincode = pincode;

  if (user) {
    const supabase = await createClient();
    const { data: customer } = await supabase
      .from('customers')
      .select('id, full_name, email, mobile_number')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customer) {
      let phone = customer.mobile_number || '';
      const updateData = { ...addressUpdate } as Record<string, string>;
      if (!phone) {
        // Logged-in customers without a saved number provide one at checkout (the gateway requires it)
        const check = validatePhoneNumber(contactPhone || '');
        if (!check.isValid || !check.normalized) throw new Error(check.error || 'Please provide a valid phone number.');
        phone = check.normalized;
        updateData.mobile_number = phone;
      }
      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin.from('customers').update(updateData).eq('id', customer.id);
      }
      return { id: customer.id, name: customer.full_name, email: customer.email || user.email || null, phone, userEmail: user.email };
    }
  }

  if (!guestDetails) throw new Error('Guest details required for unauthenticated checkout');

  const phoneValidation = validatePhoneNumber(guestDetails.phone);
  if (!phoneValidation.isValid || !phoneValidation.normalized) {
    throw new Error(phoneValidation.error || 'Please provide a valid phone number.');
  }
  const strippedPhone = phoneValidation.normalized;

  const { data: existingGuest } = await supabaseAdmin
    .from('customers')
    .select('id, full_name, mobile_number')
    .eq('email', guestDetails.email)
    .limit(1)
    .maybeSingle();

  if (existingGuest) {
    const updateData = { ...addressUpdate } as Record<string, string>;
    let phone = existingGuest.mobile_number || '';
    if (guestDetails.phone && guestDetails.phone !== existingGuest.mobile_number) {
      updateData.mobile_number = strippedPhone;
      phone = strippedPhone;
    }
    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin.from('customers').update(updateData).eq('id', existingGuest.id);
    }
    return { id: existingGuest.id, name: existingGuest.full_name, email: guestDetails.email, phone: phone || strippedPhone, userEmail: undefined };
  }

  const guestRef = 'GST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: newGuest, error: createError } = await supabaseAdmin
    .from('customers')
    .insert({
      customer_reference: guestRef,
      full_name: guestDetails.fullName,
      email: guestDetails.email,
      mobile_number: strippedPhone,
      address: deliveryAddress,
      pincode: pincode,
      is_active: true,
      user_id: null
    })
    .select('id')
    .single();

  if (createError || !newGuest) throw new Error('Failed to create guest profile');
  return { id: newGuest.id, name: guestDetails.fullName, email: guestDetails.email, phone: strippedPhone, userEmail: undefined };
}

/**
 * Validates the cart against the catalogue (prices, stock, box capacity), resolves the customer
 * and returns an authoritative, priced snapshot. Nothing is charged or deducted here.
 */
export async function prepareOrder(
  cartItems: any[],
  deliveryAddress?: string,
  pincode?: string,
  guestDetails?: GuestDetails,
  contactPhone?: string
): Promise<PreparedOrder> {
  const customer = await resolveCustomer(deliveryAddress, pincode, guestDetails, contactPhone);

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
      .select('id, name, selling_price, stock_quantity, status, category:categories(name), product_pricing(cost_price)')
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

  // Verify box capacity for personalized hampers (defense-in-depth against a tampered cart payload)
  const packagingCategory = activeCustomizationCategories.find(c => c.id === 'cat-packaging');
  if (packagingCategory) {
    for (const item of personalizedHampers) {
      const boxSelection = (item.customizations || []).find((c: any) => c.categoryId === 'cat-packaging');
      if (!boxSelection) continue;
      const boxOption = (packagingCategory.options || []).find(o => o.id === boxSelection.optionId);
      if (!boxOption || boxOption.max_items == null) continue;
      const totalQty = (item.products || []).reduce((sum: number, p: any) => sum + (Number(p.quantity) || 0), 0);
      if (totalQty > boxOption.max_items) {
        throw new Error(`"${item.name}" has ${totalQty} items, which exceeds the ${boxOption.max_items}-item capacity of "${boxOption.name}". Please remove some items or choose a larger box.`);
      }
    }
  }

  // 4. Construct authoritative line items & snapshots
  let grandSubtotal = 0;
  const purchaseItems: PurchaseItemSnapshot[] = [];
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
      catalog_unit_price: Number(dbProd.product_pricing?.[0]?.cost_price || dbProd.product_pricing?.cost_price) || Number(dbProd.selling_price) || 0,
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

    // Products in this hamper
    for (const p of (item.products || [])) {
      const dbProd = dbProducts.find(prod => prod.id === p.id);
      const unitPrice = Number(dbProd.selling_price) || 0;
      const totalProductQty = p.quantity * hamperQty;
      const lineTotal = unitPrice * totalProductQty;
      grandSubtotal += lineTotal;

      purchaseItems.push({
        product_id: dbProd.id,
        product_name_snapshot: `${hamperPrefix} ${dbProd.name}`,
        category_snapshot: (dbProd.category as any)?.name || 'Hamper Item',
        quantity: totalProductQty,
        catalog_unit_price: Number(dbProd.product_pricing?.[0]?.cost_price || dbProd.product_pricing?.cost_price) || Number(dbProd.selling_price) || 0,
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

  const hamperDemand: Record<string, number> = {};
  premadeHampers.forEach(h => { hamperDemand[h.id] = (hamperDemand[h.id] || 0) + h.quantity; });

  return {
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    snapshot: {
      subtotal: grandSubtotal,
      purchaseItems,
      orderNotes,
      pincode: pincode || null,
      productDemand: Object.fromEntries(productStockDemand),
      hamperDemand,
      customerName: customer.name,
      customerPhone: customer.phone,
      isQATest: customer.userEmail === QA_EMAIL || guestDetails?.email === QA_EMAIL,
    },
  };
}

/** Creates the purchase from a prepared order. Payment is collected afterwards over WhatsApp. */
export async function createPurchase(customerId: string, snap: OrderSnapshot) {
  // 5. Create Purchase Record
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from('purchases')
    .insert({
      customer_id: customerId,
      subtotal: snap.subtotal,
      final_amount: snap.subtotal,
      amount_due: snap.subtotal,
      amount_paid: 0,
      status: 'PENDING',
      payment_status: 'PENDING',
      sale_source: 'WEBSITE',
      notes: snap.orderNotes,
      purchase_date: new Date().toISOString()
    })
    .select('id')
    .single();

  if (purchaseError || !purchase) {
    console.error("Purchase insert error:", purchaseError);
    throw new Error("Failed to create order record.");
  }

  // 6. Insert Purchase Items
  const { error: itemsError } = await supabaseAdmin
    .from('purchase_items')
    .insert(snap.purchaseItems.map(item => ({ ...item, purchase_id: purchase.id })));

  if (itemsError) {
    console.error("Items insert error:", itemsError);
    await supabaseAdmin.from('purchases').delete().eq('id', purchase.id);
    throw new Error("Failed to save order items.");
  }

  // 7. Authoritatively Deduct Inventory
  const productIds = Object.keys(snap.productDemand);
  if (productIds.length > 0) {
    const { data: products } = await supabaseAdmin.from('products').select('id, stock_quantity').in('id', productIds);
    for (const p of products || []) {
      if (p.stock_quantity === null) continue;
      await supabaseAdmin.from('products').update({ stock_quantity: Math.max(0, p.stock_quantity - snap.productDemand[p.id]) }).eq('id', p.id);
    }
  }
  const hamperIds = Object.keys(snap.hamperDemand);
  if (hamperIds.length > 0) {
    const { data: hampers } = await supabaseAdmin.from('hampers').select('id, stock_quantity').in('id', hamperIds);
    for (const h of hampers || []) {
      if (h.stock_quantity === null) continue;
      await supabaseAdmin.from('hampers').update({ stock_quantity: Math.max(0, h.stock_quantity - snap.hamperDemand[h.id]) }).eq('id', h.id);
    }
  }

  const orderRef = purchase.id.split('-')[0].toUpperCase();

  // 8. Dispatch Telegram Notification
  try {
    if (!snap.isQATest) {
      const customerInfo = snap.customerName ? `${snap.customerName}${snap.customerPhone ? ` (${snap.customerPhone})` : ''}` : 'Storefront Customer';
      const itemsList = snap.purchaseItems
        .map(i => `• <b>${i.product_name_snapshot}</b> × ${i.quantity} — ₹${i.line_total.toFixed(2)}`)
        .join('\n');

      const tgMsg = `
🛍️ <b>NEW ORDER CONFIRMED!</b>
<b>Order ID:</b> #${orderRef}
<b>Customer:</b> ${customerInfo}
<b>Total Amount:</b> ₹${snap.subtotal.toFixed(2)}
<b>Payment:</b> ⏳ Pending — customer will share the Order ID on WhatsApp for the payment QR
<b>Delivery Pincode:</b> ${snap.pincode || 'N/A'}

<b>Order Contents:</b>
${itemsList}
      `.trim();

      await sendTelegramMessage(tgMsg, 'ALERT');
    }
  } catch (tgErr) {
    console.error("Telegram notification error:", tgErr);
  }

  try {
    const { createNotification } = await import('@/actions/notification.actions');
    await createNotification({
      customer_id: customerId,
      purchase_id: purchase.id,
      type: 'PURCHASE_CREATED',
      title: 'Order Placed Successfully 🛍️',
      message: `Your Hamperly order #${orderRef} has been placed. Share this Order ID with us on WhatsApp to receive the payment QR.`
    });
  } catch (notifErr) {
    console.error("Failed to create app notification:", notifErr);
  }

  revalidatePath('/admin/customers-purchases');
  revalidatePath('/account/orders');

  return purchase.id as string;
}
