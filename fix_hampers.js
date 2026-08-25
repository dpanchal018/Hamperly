const fs = require("fs");
let c = fs.readFileSync("src/actions/hamper.actions.ts", "utf8");

c = c.replace(/export async function createHamper\([^)]+\) {\s*const supabase = await createClient\(\);/g, 
  (match) => match + "\n  await requireAdmin();"
);

c = c.replace(/export async function updateHamper\([^)]+\) {\s*const supabase = await createClient\(\);/g, 
  (match) => match + "\n  await requireAdmin();"
);

c = c.replace(/export async function deleteHamper\([^)]+\) {\s*const supabase = await createClient\(\);/g, 
  (match) => match + "\n  await requireAdmin();"
);

fs.writeFileSync("src/actions/hamper.actions.ts", c, "utf8");
console.log("Patched hampers");
