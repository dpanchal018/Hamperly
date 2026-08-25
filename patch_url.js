const fs = require("fs");
let c = fs.readFileSync("src/actions/users.actions.ts", "utf8");

// Add headers import if not exists
if (!c.includes("import { headers } from 'next/headers'")) {
  c = c.replace(
    'import { revalidatePath } from "next/cache";',
    'import { revalidatePath } from "next/cache";\nimport { headers } from "next/headers";'
  );
}

// Find generateLink and inject redirectTo
const searchStr = `const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });`;

const replaceStr = `const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://hamperly.vercel.app';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: \`\${origin}/admin-setup\`
      }
    });`;

c = c.replace(searchStr, replaceStr);

fs.writeFileSync("src/actions/users.actions.ts", c, "utf8");
console.log("Patched users.actions.ts");
