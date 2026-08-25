const fs = require("fs");
let c = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");

c = c.replace(
  "const productSales = {};", 
  "const productSales: Record<string, {name: string, type: 'PRODUCT'|'HAMPER', qty: number}> = {};"
);

fs.writeFileSync("src/actions/analytics.actions.ts", c, "utf8");
console.log("Fixed types");
