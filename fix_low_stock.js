const fs = require("fs");

// 1. Update backend (analytics.actions.ts)
let actions = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");
actions = actions.replace(
  /\.from\('products'\)\s*\.select\('name, stock_quantity'\)/,
  `.from('hampers')\n    .select('name, stock_quantity')`
);
actions = actions.replace(
  /const \{ data: lowStockProducts \} = await supabase/,
  `const { data: lowStockHampers } = await supabase`
);
actions = actions.replace(
  /lowStockProducts: lowStockProducts \|\| \[\]/,
  `lowStockHampers: lowStockHampers || []`
);
fs.writeFileSync("src/actions/analytics.actions.ts", actions, "utf8");

// 2. Update frontend (admin/page.tsx)
let page = fs.readFileSync("src/app/admin/page.tsx", "utf8");
page = page.replace(/products\.lowStockProducts\.map/g, "products.lowStockHampers.map");
page = page.replace(/products\.lowStockProducts\.length/g, "products.lowStockHampers.length");
page = page.replace(/href="\/admin\/products"/g, `href="/admin/hampers"`);
fs.writeFileSync("src/app/admin/page.tsx", page, "utf8");

console.log("Updated low stock alerts to Hampers");
