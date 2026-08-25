const fs = require("fs");
let c = fs.readFileSync("src/actions/purchase.actions.ts", "utf8");

c = c.replace(/export async function updatePurchaseStatus\([^)]+\) {\s*const supabase = await createClient\(\);\s*const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(!user\) return { error: 'Unauthorized' };/g, 
  (match) => {
    return match.replace(/const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(!user\) return { error: 'Unauthorized' };/, "await requireAdmin();");
  }
);

c = c.replace(/export async function updatePaymentStatus\([^)]+\) {\s*const supabase = await createClient\(\);\s*const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(!user\) return { error: 'Unauthorized' };/g, 
  (match) => {
    return match.replace(/const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(!user\) return { error: 'Unauthorized' };/, "await requireAdmin();");
  }
);

fs.writeFileSync("src/actions/purchase.actions.ts", c, "utf8");
console.log("Patched purchases");
