const fs = require("fs");
const file = "src/app/(customer)/account/orders/page.tsx";
let content = fs.readFileSync(file, "utf8");

// Fix final_amount
content = content.replace(/>\?\{order\.final_amount/g, '>?{order.final_amount');
// Fix line_total
content = content.replace(/>\s*\?\{item\.line_total/g, '>\n                          ?{item.line_total');

fs.writeFileSync(file, content, "utf8");
console.log("Done");
