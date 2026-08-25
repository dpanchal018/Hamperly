const fs = require("fs");
let c = fs.readFileSync("src/actions/auth.actions.ts", "utf8");

c = c.replace(
  "export async function login(formData: FormData) {\n  const email = formData.get('email') as string\n  const password = formData.get('password') as string",
  "export async function login(formData: FormData) {\n  const email = formData.get('email') as string\n  const password = formData.get('password') as string\n  const keepLoggedIn = formData.get('keepLoggedIn') === 'on'"
);

c = c.replace(
  "const supabase = await createClient()",
  "const supabase = await createClient(keepLoggedIn)"
);

fs.writeFileSync("src/actions/auth.actions.ts", c, "utf8");
console.log("Patched auth.actions.ts");
