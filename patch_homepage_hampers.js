const fs = require('fs');
let content = fs.readFileSync('src/app/(customer)/page.tsx', 'utf8');

content = content.replace(
  `const featuredHampers = hampers.slice(0, 3);`,
  `// Show only IN-STOCK hampers for the homepage
  const inStockHampers = hampers.filter(h => h.stock_quantity === null || h.stock_quantity > 0);
  // Optional: Shuffle or sort by some metric. For now, take the newest in-stock ones.
  const featuredHampers = inStockHampers.slice(0, 3);`
);

fs.writeFileSync('src/app/(customer)/page.tsx', content, 'utf8');
console.log('Patched page.tsx featured hampers');
