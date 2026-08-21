'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';

export async function getDashboardStats() {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Total Customers
    const { count: totalCustomers, error: customerErr } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (customerErr) throw customerErr;

    // Total Purchases (Completed only)
    const { count: totalPurchases, error: purchaseErr } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED');
    if (purchaseErr) throw purchaseErr;

    // Total Amount Collected & Gross Profit calculation
    // Note: Since Supabase js doesn't support complex aggregations easily out of the box,
    // we fetch completed purchases to sum up here.
    const { data: completedPurchases, error: financialsErr } = await supabase
      .from('purchases')
      .select('amount_paid, final_amount, subtotal, purchase_items(actual_unit_price, catalog_unit_price, quantity)')
      .eq('status', 'COMPLETED');
      
    if (financialsErr) throw financialsErr;

    let totalCollected = 0;
    let totalSales = 0;
    let grossProfit = 0;

    completedPurchases?.forEach((p: any) => {
      totalCollected += Number(p.amount_paid) || 0;
      totalSales += Number(p.final_amount) || 0;
      
      // Rough profit estimation: 
      // Assuming catalog_unit_price is the cost, actual_unit_price is selling price
      // (If there was a separate 'cost_price' field in products we'd use that. 
      // For now, let's assume actual - catalog is the margin, or just totalSales - cost)
      let costForPurchase = 0;
      p.purchase_items?.forEach((item: any) => {
         // Fallback logic, as we lack explicit 'cost' column:
         // If catalog_price is higher than actual, we have a loss.
         costForPurchase += (Number(item.catalog_unit_price) || 0) * (Number(item.quantity) || 0);
      });
      // Profit = Final Amount Paid - Total Cost
      grossProfit += (Number(p.final_amount) || 0) - costForPurchase;
    });

    return {
      totalCustomers: totalCustomers || 0,
      totalPurchases: totalPurchases || 0,
      totalCollected,
      totalSales,
      grossProfit
    };

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}
