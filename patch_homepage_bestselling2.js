const fs = require('fs');
let content = fs.readFileSync('src/app/(customer)/page.tsx', 'utf8');

// We need to import createClient
if (!content.includes("import { createClient }")) {
  content = content.replace(
    `import Image from 'next/image';`,
    `import Image from 'next/image';\nimport { createClient } from '@/lib/supabase/server';`
  );
}

const oldLogicStart = `  const hampers = await getPublicHampers();`;
const oldLogicEnd = `  const featuredOccasions = occasions.slice(0, 4);`;

const newLogic = `  const supabase = await createClient();
  const occasions = await getPublicOccasions();
  const featuredReviews = await getFeaturedReviews();

  // 1. Fetch active, IN-STOCK hampers
  const { data: activeHampers } = await supabase
    .from('hampers')
    .select('*')
    .eq('is_active', true)
    .or('stock_quantity.gt.0,stock_quantity.is.null');

  // 2. Fetch completed purchase items to calculate best sellers
  const { data: completedPurchases } = await supabase.from('purchases').select('id').eq('status', 'COMPLETED');
  const completedIds = new Set(completedPurchases?.map(p => p.id) || []);
  
  const { data: items } = await supabase.from('purchase_items').select('purchase_id, product_name_snapshot, quantity').is('product_id', null);
  
  const salesCount: Record<string, number> = {};
  if (items) {
    items.forEach(item => {
      if (completedIds.has(item.purchase_id)) {
        salesCount[item.product_name_snapshot] = (salesCount[item.product_name_snapshot] || 0) + (item.quantity || 1);
      }
    });
  }

  let validHampers = activeHampers || [];
  
  // Sort by sales count (descending), fallback to created_at
  validHampers.sort((a, b) => {
    const salesA = salesCount[a.name] || 0;
    const salesB = salesCount[b.name] || 0;
    if (salesA !== salesB) return salesB - salesA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const featuredHampers = validHampers.slice(0, 3);
  const featuredOccasions = occasions.slice(0, 4);`;

const startIndex = content.indexOf(oldLogicStart);
const endIndex = content.indexOf(oldLogicEnd) + oldLogicEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newLogic + content.substring(endIndex);
  fs.writeFileSync('src/app/(customer)/page.tsx', content, 'utf8');
  console.log('Patched page.tsx with TRUE best-selling logic successfully!');
} else {
  console.log('Could not find boundaries.');
}
