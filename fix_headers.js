const fs = require("fs");
let c = fs.readFileSync("src/actions/users.actions.ts", "utf8");

c = c.replace(
  "const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://hamperly.vercel.app';",
  "const headersList = await headers();\n      const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://hamperly.vercel.app';"
);

fs.writeFileSync("src/actions/users.actions.ts", c, "utf8");
console.log("Fixed headers await");
