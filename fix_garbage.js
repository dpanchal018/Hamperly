const fs = require("fs");
let c = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");

const idx = c.indexOf("export async function getProductMetrics");
c = c.substring(0, idx);

c += `export async function getProductMetrics() {
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
`;

fs.writeFileSync("src/actions/analytics.actions.ts", c, "utf8");
console.log("Cleaned up garbage code");
