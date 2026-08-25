const fs = require("fs");
let c = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");

// FIX GET_PROFIT_METRICS
c = c.replace(/export async function getProfitMetrics\(\) \{[\s\S]*?export async function getProductMetrics/m, 
`export async function getProfitMetrics() {
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

export async function getProductMetrics`);

// FIX GET_PRODUCT_METRICS
c = c.replace(/export async function getProductMetrics\(\) \{[\s\S]*?\}\s*$/m,
`export async function getProductMetrics() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: completedPurchases } = await supabase.from('purchases').select('id').eq('status', 'COMPLETED');
  const completedIds = new Set(completedPurchases?.map(p => p.id) || []);
  
  const { data: items } = await supabase
    .from('purchase_items')
    .select('purchase_id, product_id, product_name_snapshot, quantity');
    
  const productSales = {};
  
  if (items) {
    const validItems = items.filter(item => completedIds.has(item.purchase_id));
    validItems.forEach(item => {
      const type = item.product_id ? 'PRODUCT' : 'HAMPER';
      const key = item.product_id ? \`p_\${item.product_id}\` : \`h_\${item.product_name_snapshot}\`;
      
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
  
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('name, stock_quantity')
    .lte('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })
    .limit(5);

  return { bestHampers, bestProducts, slowProducts, lowStockProducts: lowStockProducts || [] };
}
`);

fs.writeFileSync("src/actions/analytics.actions.ts", c, "utf8");
console.log("Patched both metrics!");
