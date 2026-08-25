const fs = require("fs");
let c = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");
c = c.replace(/if \(validItems\) \{\s*validItems\.forEach/g, "validItems.forEach");
fs.writeFileSync("src/actions/analytics.actions.ts", c, "utf8");
