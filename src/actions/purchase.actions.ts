'use server';

import { createClient } from '@/lib/supabase/server';
import { Purchase, PurchaseItem, PurchaseStatus } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

async function reduceInventory(productId: string, quantity: number, reason: string, refId: string) {
  const supabase = await createClient();
  const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', productId).single();
  if (!product) return { error: 'Product not found' };
  if (product.stock_quantity < quantity) return { error: `Insufficient stock` };

  const { error } = await supabase.from('products').update({ stock_quantity: product.stock_quantity - quantity }).eq('id', productId);
  return { error: error?.message };
}

async function restoreInventory(productId: string, quantity: number, reason: string, refId: string) {
  const supabase = await createClient();
  const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', productId).single();
  if (!product) return { error: 'Product not found' };

  const { error } = await supabase.from('products').update({ stock_quantity: product.stock_quantity + quantity }).eq('id', productId);
  return { error: error?.message };
}

export async function createPurchase(
  purchaseData: Partial<Purchase>, 
  itemsData: Partial<PurchaseItem>[]
) {
  const supabase = await createClient();
  
  // 1. Validate Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
  if (roleData?.role !== 'ADMIN') return { error: 'Unauthorized' };

  // 2. Insert Purchase (server authoritative calculation)
  const calculatedSubtotal = itemsData.reduce((sum, item) => sum + ((item.quantity || 0) * (item.actual_unit_price || 0)), 0);
  const calculatedFinalAmount = Math.max(0, calculatedSubtotal - (purchaseData.discount || 0));
  const calculatedAmountDue = Math.max(0, calculatedFinalAmount - (purchaseData.amount_paid || 0));

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([{
      ...purchaseData,
      subtotal: calculatedSubtotal,
      final_amount: calculatedFinalAmount,
      amount_due: calculatedAmountDue,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (purchaseError) {
    console.error('Error creating purchase:', purchaseError);
    return { error: purchaseError.message };
  }

  // Insert initial payment log if any amount was paid upfront
  if ((purchaseData.amount_paid || 0) > 0 && purchaseData.payment_mode) {
    await supabase.from('payment_logs').insert({
      purchase_id: purchase.id,
      amount: purchaseData.amount_paid,
      payment_mode: purchaseData.payment_mode,
      created_by: user.id
    });
  }

  // 3. Insert Purchase Items
  const itemsToInsert = itemsData.map(item => {
    const { product_id, ...rest } = item;
    return {
      ...rest,
      // Only include product_id if it's a valid string (not empty)
      ...(product_id ? { product_id } : {}),
      purchase_id: purchase.id,
      created_at: new Date().toISOString(),
    };
  });

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('Error creating purchase items:', itemsError);
    await supabase.from('purchases').delete().eq('id', purchase.id);
    return { error: itemsError.message };
  }

  // 4. Handle Inventory if status is COMPLETED
  // (Disabled for now as requested by user, to keep mock inventory separate)
  if (purchase.status === 'COMPLETED') {
    for (const item of itemsData) {
      if (item.product_name_snapshot) {
        // Only deduct inventory if it matches a pre-made Hamper
        const { data: hamper } = await supabase
          .from('hampers')
          .select('id, stock_quantity')
          .eq('name', item.product_name_snapshot)
          .single();
        
        if (hamper) {
          await supabase
            .from('hampers')
            .update({ stock_quantity: Math.max(0, hamper.stock_quantity - (item.quantity || 1)) })
            .eq('id', hamper.id);
        }
      }
    }
    revalidatePath('/admin/hampers');
  }

  revalidatePath('/admin/customers-purchases');
  return { purchase };
}

export async function updatePurchaseStatus(purchaseId: string, newStatus: PurchaseStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: purchase } = await supabase.from('purchases').select('*, purchase_items(*)').eq('id', purchaseId).single();
  if (!purchase) return { error: 'Purchase not found' };
  if (purchase.status === newStatus) return { purchase }; 

  if (purchase.status !== 'COMPLETED' && newStatus === 'COMPLETED') {
    const { sendTelegramMessage } = await import('./telegram.actions');

    for (const item of purchase.purchase_items) {
      if (item.product_id) {
        // It's an individual Product add-on
        const { data: product } = await supabase.from('products').select('id, stock_quantity').eq('id', item.product_id).single();
        if (product) {
          if (product.stock_quantity < item.quantity) {
            return { error: `Insufficient stock for Product: ${item.product_name_snapshot}` };
          }
          const newStock = product.stock_quantity - item.quantity;
          await supabase.from('products').update({ stock_quantity: newStock }).eq('id', product.id);
          
          if (newStock <= 3) {
            await sendTelegramMessage(`⚠️ <b>LOW STOCK ALERT</b>\nProduct: ${item.product_name_snapshot}\nRemaining Stock: ${newStock}`);
          }
        }
      } else if (item.product_name_snapshot) {
        // It's a Hamper (no product_id)
        const { data: hamper } = await supabase.from('hampers').select('id, stock_quantity').eq('name', item.product_name_snapshot).single();
        if (hamper) {
          if (hamper.stock_quantity < item.quantity) {
            return { error: `Insufficient stock for Hamper: ${item.product_name_snapshot}` };
          }
          const newStock = hamper.stock_quantity - item.quantity;
          await supabase.from('hampers').update({ stock_quantity: newStock }).eq('id', hamper.id);

          if (newStock <= 3) {
            await sendTelegramMessage(`⚠️ <b>LOW STOCK ALERT</b>\nHamper: ${item.product_name_snapshot}\nRemaining Stock: ${newStock}`);
          }
        }
      }
    }
    revalidatePath('/admin/hampers');
    revalidatePath('/admin/products');
  } else if (purchase.status === 'COMPLETED' && newStatus === 'CANCELLED') {
    for (const item of purchase.purchase_items) {
      if (item.product_id) {
        // It's an individual Product add-on
        const { data: product } = await supabase.from('products').select('id, stock_quantity').eq('id', item.product_id).single();
        if (product) {
          await supabase.from('products').update({ stock_quantity: product.stock_quantity + item.quantity }).eq('id', product.id);
        }
      } else if (item.product_name_snapshot) {
        // It's a Hamper
        const { data: hamper } = await supabase.from('hampers').select('id, stock_quantity').eq('name', item.product_name_snapshot).single();
        if (hamper) {
          await supabase.from('hampers').update({ stock_quantity: hamper.stock_quantity + item.quantity }).eq('id', hamper.id);
        }
      }
    }
    revalidatePath('/admin/hampers');
    revalidatePath('/admin/products');
  }

  const { data: updatedPurchase, error } = await supabase
    .from('purchases')
    .update({ 
      status: newStatus,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', purchaseId)
    .select()
    .single();

  if (error) return { error: error.message };

  // Generate notification based on status change
  const { createNotification } = await import('./notification.actions');
  const shortId = purchaseId.split('-')[0];
  
  if (newStatus === 'CONFIRMED') {
    await createNotification({ customer_id: purchase.customer_id, purchase_id: purchaseId, type: 'ORDER_CONFIRMED', title: 'Your order is confirmed 🎁', message: `Your Hamperly order ${shortId} has been confirmed.` });
  } else if (newStatus === 'PREPARING') {
    await createNotification({ customer_id: purchase.customer_id, purchase_id: purchaseId, type: 'ORDER_PREPARING', title: 'Your hamper is being prepared 🎁', message: `We're preparing your hamper for order ${shortId}.` });
  } else if (newStatus === 'READY') {
    await createNotification({ customer_id: purchase.customer_id, purchase_id: purchaseId, type: 'ORDER_READY', title: 'Your hamper is ready! 🎁', message: `Your hamper for order ${shortId} is ready.` });
  } else if (newStatus === 'COMPLETED') {
    await createNotification({ customer_id: purchase.customer_id, purchase_id: purchaseId, type: 'ORDER_COMPLETED', title: 'Your order is completed 🎉', message: `Your Hamperly order ${shortId} has been completed.` });
  } else if (newStatus === 'CANCELLED') {
    await createNotification({ customer_id: purchase.customer_id, purchase_id: purchaseId, type: 'ORDER_CANCELLED', title: 'Your order has been cancelled', message: `Your Hamperly order ${shortId} has been cancelled.` });
  }

  revalidatePath('/admin/customers-purchases');
  revalidatePath(`/admin/customers-purchases/${purchaseId}`);
  return { purchase: updatedPurchase };
}

export async function updatePaymentStatus(purchaseId: string, amountPaid: number, paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING', paymentMode: string = 'UPI') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: purchase } = await supabase.from('purchases').select('amount_paid, final_amount').eq('id', purchaseId).single();
  if (!purchase) return { error: 'Purchase not found' };

  const newAmountPaid = Number(purchase.amount_paid) + amountPaid;
  let newStatus = paymentStatus;
  
  if (newAmountPaid >= Number(purchase.final_amount)) {
    newStatus = 'PAID';
  }

  // Update purchase table
  const { data: updatedPurchase, error } = await supabase
    .from('purchases')
    .update({ 
      amount_paid: newAmountPaid,
      amount_due: Math.max(0, Number(purchase.final_amount) - newAmountPaid),
      payment_status: newStatus,
      payment_mode: paymentMode as any, // Update latest mode on parent table as well
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', purchaseId)
    .select()
    .single();

  if (error) return { error: error.message };

  // Log the payment
  await supabase.from('payment_logs').insert({
    purchase_id: purchaseId,
    amount: amountPaid,
    payment_mode: paymentMode as any,
    created_by: user.id
  });

  const { createNotification } = await import('./notification.actions');
  const shortId = purchaseId.split('-')[0];

  // Send PAYMENT_RECEIVED notification
  if (amountPaid > 0) {
    await createNotification({ 
      customer_id: updatedPurchase.customer_id, 
      purchase_id: purchaseId, 
      type: 'PAYMENT_RECEIVED', 
      title: 'Payment received 💰', 
      message: `We received your payment of ₹${amountPaid} for order ${shortId}.` 
    });
  }

  if (newStatus === 'PAID') {
    // Send PAYMENT_COMPLETED notification
    await createNotification({ 
      customer_id: updatedPurchase.customer_id, 
      purchase_id: purchaseId, 
      type: 'PAYMENT_COMPLETED', 
      title: 'Payment completed 💰', 
      message: `Your order ${shortId} is now fully paid.` 
    });

    const res = await updatePurchaseStatus(purchaseId, 'COMPLETED');
    if (res.error) return res;
  }

  revalidatePath('/admin/customers-purchases');
  revalidatePath(`/admin/customers-purchases/${purchaseId}`);
  return { purchase: updatedPurchase };
}

export async function getPurchases(filters?: any) {
  const supabase = await createClient();
  
  let query = supabase
    .from('purchases')
    .select(`
      *,
      customers ( id, full_name, mobile_number, email ),
      purchase_items ( id, product_name_snapshot, quantity, line_total, catalog_unit_price, actual_unit_price )
    `)
    .order('purchase_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  if (filters?.payment_mode) query = query.eq('payment_mode', filters.payment_mode);
  if (filters?.sale_source) query = query.eq('sale_source', filters.sale_source);

  const { data: purchases, error } = await query;
  if (error) return { error: error.message };
  return { purchases };
}

export async function getPurchaseDetails(id: string) {
  const supabase = await createClient();
  
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select(`
      *,
      customers ( * ),
      purchase_items ( * ),
      payment_logs ( * )
    `)
    .eq('id', id)
    .single();

  if (error) return { error: error.message };
  return { purchase };
}

export async function exportPurchasesToExcel(filters?: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
  if (roleData?.role !== 'ADMIN') return { error: 'Unauthorized' };

  let query = supabase
    .from('purchases')
    .select(`
      *,
      customers ( id, full_name, mobile_number, email ),
      purchase_items ( id, product_id, product_name_snapshot, category_snapshot, quantity, catalog_unit_price, actual_unit_price, line_total )
    `)
    .order('purchase_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  
  const { data: purchases, error } = await query;
  if (error) return { error: error.message };

  const XLSX = await import('xlsx');
  
  // Sheet 1: Purchases
  const purchasesSheetData = purchases.map((p: any) => ({
    'Purchase ID': p.id,
    'Customer ID': p.customer_id,
    'Customer Name': p.customers?.full_name,
    'Mobile': p.customers?.mobile_number,
    'Email': p.customers?.email,
    'Purchase Date': new Date(p.purchase_date).toLocaleDateString(),
    'Occasion': p.occasion_id || '',
    'Sale Source': p.sale_source,
    'Hamper Reference': p.hamper_id || '',
    'Subtotal': p.subtotal,
    'Discount': p.discount,
    'Final Amount': p.final_amount,
    'Amount Paid': p.amount_paid,
    'Amount Due': p.amount_due,
    'Payment Mode': p.payment_mode || '',
    'Payment Status': p.payment_status,
    'Payment Reference': p.payment_reference || '',
    'Purchase Status': p.status,
    'Created At': new Date(p.created_at).toLocaleString()
  }));

  // Sheet 2: Purchase Items
  const itemsSheetData = purchases.flatMap((p: any) => 
    p.purchase_items.map((item: any) => ({
      'Purchase ID': p.id,
      'Customer Name': p.customers?.full_name,
      'Product ID': item.product_id,
      'Product Name': item.product_name_snapshot,
      'Category': item.category_snapshot || '',
      'Quantity': item.quantity,
      'Catalog Unit Price': item.catalog_unit_price,
      'Actual Unit Price': item.actual_unit_price,
      'Line Total': item.line_total,
      'Purchase Date': new Date(p.purchase_date).toLocaleDateString()
    }))
  );

  const workbook = XLSX.utils.book_new();
  const purchasesSheet = XLSX.utils.json_to_sheet(purchasesSheetData);
  const itemsSheet = XLSX.utils.json_to_sheet(itemsSheetData);

  XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'Purchases');
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Purchase Items');

  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return { buffer: Array.from(excelBuffer) }; // returning as array of bytes since server actions can't easily serialize Buffer
}
