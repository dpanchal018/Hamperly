'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';

function getStartOfDay() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function getStartOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function getStartOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0,0,0,0);
  return d.toISOString();
}

export async function getRevenueMetrics() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: purchases } = await supabase
    .from('purchases')
    .select('final_amount, purchase_date')
    .eq('status', 'COMPLETED');

  let today = 0, week = 0, month = 0, ytd = 0;
  if (!purchases) return { today, week, month, ytd };

  const startOfDay = new Date(getStartOfDay()).getTime();
  const startOfWeek = new Date(getStartOfWeek()).getTime();
  const startOfMonth = new Date(getStartOfMonth()).getTime();
  const startOfYear = new Date(getStartOfYear()).getTime();

  purchases.forEach(p => {
    const pDate = new Date(p.purchase_date).getTime();
    const amount = Number(p.final_amount) || 0;
    if (pDate >= startOfDay) today += amount;
    if (pDate >= startOfWeek) week += amount;
    if (pDate >= startOfMonth) month += amount;
    if (pDate >= startOfYear) ytd += amount;
  });

  return { today, week, month, ytd };
}

export async function getCustomerMetrics() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: customers } = await supabase.from('customers').select('id, created_at');
  const { data: purchases } = await supabase.from('purchases').select('customer_id, final_amount').neq('status', 'CANCELLED');
  
  const startOfMonth = new Date(getStartOfMonth()).getTime();
  
  let newCustomers = 0;
  let totalCustomers = customers ? customers.length : 0;
  
  if (customers) {
    customers.forEach(c => {
      if (new Date(c.created_at).getTime() >= startOfMonth) newCustomers++;
    });
  }

  let returningCustomers = 0;
  let totalValue = 0;
  
  if (purchases) {
    const customerPurchaseCounts: Record<string, number> = {};
    purchases.forEach(p => {
      customerPurchaseCounts[p.customer_id] = (customerPurchaseCounts[p.customer_id] || 0) + 1;
      totalValue += Number(p.final_amount) || 0;
    });
    
    returningCustomers = Object.values(customerPurchaseCounts).filter(count => count > 1).length;
  }
  
  const repeatPurchaseRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
  const averageCustomerValue = totalCustomers > 0 ? totalValue / totalCustomers : 0;

  return { newCustomers, returningCustomers, repeatPurchaseRate, averageCustomerValue };
}

export async function getOrderMetrics() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, final_amount, status, created_at, updated_at, purchase_date');

  let ordersToday = 0;
  let totalOrderValue = 0;
  let cancelledOrders = 0;
  let fulfillmentTimes: number[] = [];

  const startOfDay = new Date(getStartOfDay()).getTime();

  if (purchases && purchases.length > 0) {
    purchases.forEach(p => {
      if (new Date(p.purchase_date).getTime() >= startOfDay) ordersToday++;
      
      if (p.status !== 'CANCELLED') {
        totalOrderValue += Number(p.final_amount) || 0;
      } else {
        cancelledOrders++;
      }

      if (p.status === 'COMPLETED' && p.updated_at) {
        const created = new Date(p.created_at).getTime();
        const updated = new Date(p.updated_at).getTime();
        fulfillmentTimes.push((updated - created) / (1000 * 60 * 60)); // hours
      }
    });
  }

  const validOrders = purchases ? purchases.length - cancelledOrders : 0;
  const averageOrderValue = validOrders > 0 ? totalOrderValue / validOrders : 0;
  const cancellationRate = purchases && purchases.length > 0 ? (cancelledOrders / purchases.length) * 100 : 0;
  const avgFulfillmentTime = fulfillmentTimes.length > 0 ? fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length : 0;

  return { ordersToday, averageOrderValue, cancellationRate, avgFulfillmentTime };
}

export async function getProfitMetrics() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, final_amount, status')
    .eq('status', 'COMPLETED');
    
  const { data: purchaseItems } = await supabase
    .from('purchase_items')
    .select('purchase_id, quantity, actual_unit_price, product_id, product_name_snapshot');
    
  const { data: products } = await supabase.from('products').select('id, actual_cost');
  const { data: hampers } = await supabase.from('hampers').select('name, actual_cost');
  
  let totalRevenue = 0;
  let totalCost = 0;
  
  const productCostMap = new Map(products?.map(p => [p.id, p.actual_cost]) || []);
  const hamperCostMap = new Map(hampers?.map(h => [h.name, h.actual_cost]) || []);
  
  const completedPurchaseIds = new Set(purchases?.map(p => p.id) || []);

  if (purchases) {
    totalRevenue = purchases.reduce((sum, p) => sum + (Number(p.final_amount) || 0), 0);
  }

  if (purchaseItems) {
    purchaseItems.forEach(item => {
      if (completedPurchaseIds.has(item.purchase_id)) {
        let cost = 0;
        if (item.product_id && productCostMap.has(item.product_id)) {
          cost = productCostMap.get(item.product_id) || 0;
        } else if (!item.product_id && hamperCostMap.has(item.product_name_snapshot)) {
          cost = hamperCostMap.get(item.product_name_snapshot) || 0;
        } else {
          cost = (Number(item.actual_unit_price) || 0) * 0.6; 
        }
        totalCost += cost * (item.quantity || 1);
      }
    });
  }

  const grossProfit = totalRevenue - totalCost;
  return { revenue: totalRevenue, cost: totalCost, grossProfit };
}

export async function getProductMetrics() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: completedPurchases } = await supabase.from('purchases').select('id').eq('status', 'COMPLETED');
  const completedIds = new Set(completedPurchases?.map(p => p.id) || []);
  
  const { data: items } = await supabase
    .from('purchase_items')
    .select('purchase_id, product_id, product_name_snapshot, quantity');
    
  const productSales: Record<string, {name: string, type: 'PRODUCT'|'HAMPER', qty: number}> = {};
  
  if (items) {
    const validItems = items.filter(item => completedIds.has(item.purchase_id));
    validItems.forEach(item => {
      const type = item.product_id ? 'PRODUCT' : 'HAMPER';
      const key = item.product_id ? `p_${item.product_id}` : `h_${item.product_name_snapshot}`;
      
      if (!productSales[key]) {
        productSales[key] = {
          name: item.product_name_snapshot,
          type: type,
          qty: 0
        };
      }
      productSales[key].qty += (item.quantity || 1);
    });
  }

  const allSales = Object.values(productSales);
  const bestHampers = allSales.filter(s => s.type === 'HAMPER').sort((a,b) => b.qty - a.qty).slice(0, 5);
  const bestProducts = allSales.filter(s => s.type === 'PRODUCT').sort((a,b) => b.qty - a.qty).slice(0, 5);
  const slowProducts = allSales.filter(s => s.type === 'PRODUCT').sort((a,b) => a.qty - b.qty).slice(0, 5);
  
  const { data: lowStockHampers } = await supabase
    .from('hampers')
    .select('name, stock_quantity')
    .lte('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })
    .limit(5);

  return { bestHampers, bestProducts, slowProducts, lowStockHampers: lowStockHampers || [] };
}
