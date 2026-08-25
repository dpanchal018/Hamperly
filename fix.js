const fs = require("fs");
let c = fs.readFileSync("src/app/(customer)/account/orders/page.tsx", "utf8");
c = c.replace(/\?/g, "\u20B9");
fs.writeFileSync("src/app/(customer)/account/orders/page.tsx", c, "utf8");
