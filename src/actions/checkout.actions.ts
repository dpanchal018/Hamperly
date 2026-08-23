'use server'

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { requireCustomer, getCurrentUser } from '@/services/auth.service';

export async function placeCustomerOrder(cartItems: any[], deliveryAddress?: string) {
  try {
    await requireCustomer();
    const user = await getCurrentUser();
    if (!user) throw new Error("Not logged in");
    const supabase = await createClient(); // for authenticated reads
    
    // 1. Get the customer ID
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      throw new Error("Customer profile not found");
    }

    // Update customer address if provided
    if (deliveryAddress !== undefined) {
      await supabaseAdmin
        .from('customers')
        .update({ address: deliveryAddress })
        .eq('id', customer.id);
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Separate hampers and products
    const hamperItems = cartItems.filter(i => i.itemType !== 'PRODUCT');
    const productItems = cartItems.filter(i => i.itemType === 'PRODUCT');
    
    const hamperIds = hamperItems.map(item => item.id);
    const productIds = productItems.map(item => item.id);

    // Fetch Hampers if any
    let dbHampers: any[] = [];
    if (hamperIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('hampers')
        .select('id, name, selling_price, actual_cost, stock_quantity')
        .in('id', hamperIds);
      if (error) throw new Error("Failed to fetch hamper details");
      dbHampers = data || [];
    }

    // Fetch Products if any
    let dbProducts: any[] = [];
    if (productIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, name, stock_quantity, product_pricing(cost_price, target_margin)')
        .in('id', productIds);
      if (error) throw new Error("Failed to fetch product details");
      
      // Calculate selling price for products
      dbProducts = (data || []).map(p => {
        const pricing = p.product_pricing?.[0];
        const cost = pricing?.cost_price || 0;
        const margin = pricing?.target_margin || 0.5;
        const sellingPrice = cost / (1 - margin);
        return {
          id: p.id,
          name: p.name,
          stock_quantity: p.stock_quantity,
          actual_cost: cost,
          selling_price: Math.ceil(sellingPrice)
        };
      });
    }

    // 3. Calculate totals using DB prices
    let subtotal = 0;
    let totalCost = 0;
    const finalItemsToInsert = [];

    // Process Hampers
    for (const item of hamperItems) {
      const dbHamper = dbHampers.find(h => h.id === item.id);
      if (!dbHamper) throw new Error(`Hamper ${item.name} is no longer available`);
      if (dbHamper.stock_quantity < item.quantity) throw new Error(`Only ${dbHamper.stock_quantity} left for ${dbHamper.name}`);

      subtotal += (dbHamper.selling_price * item.quantity);
      totalCost += (dbHamper.actual_cost * item.quantity);

      finalItemsToInsert.push({
        product_id: null, // Hampers don't map to a specific individual product
        product_name_snapshot: dbHamper.name,
        category_snapshot: 'Pre-packaged Hamper',
        quantity: item.quantity,
        catalog_unit_price: dbHamper.actual_cost, 
        actual_unit_price: dbHamper.selling_price, 
        line_total: dbHamper.selling_price * item.quantity
      });
    }

    // Process Products (Add-ons)
    for (const item of productItems) {
      const dbProduct = dbProducts.find(p => p.id === item.id);
      if (!dbProduct) throw new Error(`Add-on ${item.name} is no longer available`);
      if (dbProduct.stock_quantity < item.quantity) throw new Error(`Only ${dbProduct.stock_quantity} left for ${dbProduct.name}`);

      subtotal += (dbProduct.selling_price * item.quantity);
      totalCost += (dbProduct.actual_cost * item.quantity);

      finalItemsToInsert.push({
        product_id: dbProduct.id, // Individual products map directly
        product_name_snapshot: dbProduct.name,
        category_snapshot: 'Add-on Customization',
        quantity: item.quantity,
        catalog_unit_price: dbProduct.actual_cost,
        actual_unit_price: dbProduct.selling_price,
        line_total: dbProduct.selling_price * item.quantity
      });
    }

    // 4. Create the Purchase record
    const { data: newPurchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert({
        customer_id: customer.id,
        purchase_date: new Date().toISOString(),
        sale_source: 'WEBSITE',
        subtotal: subtotal,
        discount: 0, 
        final_amount: subtotal,
        amount_paid: 0,
        amount_due: subtotal,
        status: 'PENDING',
        payment_status: 'PENDING'
      })
      .select('id')
      .single();

    if (purchaseError || !newPurchase) {
      console.error(purchaseError);
      throw new Error("Failed to create purchase record");
    }

    // 5. Create Purchase Items
    const itemsWithPurchaseId = finalItemsToInsert.map(item => ({
      ...item,
      purchase_id: newPurchase.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('purchase_items')
      .insert(itemsWithPurchaseId);

    if (itemsError) {
      console.error(itemsError);
      // Rollback is usually best practice here
      await supabaseAdmin.from('purchases').delete().eq('id', newPurchase.id);
      throw new Error("Failed to link purchase items to order");
    }

    // 6. Generate Notification
    const { createNotification } = await import('./notification.actions');
    await createNotification({
      customer_id: customer.id,
      purchase_id: newPurchase.id,
      type: 'PURCHASE_CREATED',
      title: 'Your order has been received 🎁',
      message: `Your Hamperly order ${newPurchase.id.split('-')[0]} has been successfully received.`
    });

    return { success: true, purchaseId: newPurchase.id };

  } catch (error: any) {
    console.error('Checkout error:', error);
    return { error: error.message || 'An unexpected error occurred during checkout' };
  }
}
