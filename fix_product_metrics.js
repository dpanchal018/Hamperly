const fs = require("fs");
let c = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");

c = c.replace(/const { data: items } = await supabase[\s\S]*?if \(items\)/, 
`const { data: completedPurchases } = await supabase.from('purchases').select('id').eq('status', 'COMPLETED');
  const completedIds = new Set(completedPurchases?.map(p => p.id) || []);
  
  const { data: items } = await supabase
    .from('purchase_items')
    .select('purchase_id, product_id, hamper_id, product_name_snapshot, quantity');
    
  const productSales: Record<string, {name: string, type: 'PRODUCT'|'HAMPER', qty: number}> = {};
  
  if (items) {
    const validItems = items.filter(item => completedIds.has(item.purchase_id));
    if (validItems)`);
    
fs.writeFileSync("src/actions/analytics.actions.ts", c, "utf8");
