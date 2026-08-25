const fs = require("fs");
let c = fs.readFileSync("src/actions/purchase.actions.ts", "utf8");

c = c.replace(/await requireAdmin\(\);/g, "await requireAdmin();\n    const { data: { user } } = await supabase.auth.getUser();\n    if (!user) return { error: 'Unauthorized' };");

fs.writeFileSync("src/actions/purchase.actions.ts", c, "utf8");
console.log("Patched purchases 2");
