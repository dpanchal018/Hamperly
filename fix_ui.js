const fs = require("fs");
let page = fs.readFileSync("src/app/admin/page.tsx", "utf8");

page = page.replace(
  /className=\{`text-sm font-bold px-2 py-0\.5 rounded-full \$\{item\.stock_quantity <= 0 \? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'\}`\}/g,
  "className={`text-sm font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${item.stock_quantity <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}"
);

fs.writeFileSync("src/app/admin/page.tsx", page, "utf8");
console.log("Patched UI");
