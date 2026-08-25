const fs = require("fs");

function patch(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  
  // Add import if not present
  if (!content.includes("PasswordInput")) {
    content = content.replace(
      "import { Input } from '@/components/ui/input'",
      "import { Input } from '@/components/ui/input'\nimport { PasswordInput } from '@/components/ui/PasswordInput'"
    );
  }

  // Replace <Input type="password" ... /> with <PasswordInput ... />
  // We need to match <Input ... type="password" ... /> across newlines.
  
  // It's safer to just replace `<Input` with `<PasswordInput` manually where type="password" is used.
  // We know the exact structure from our search.
  
  // Let's do a simple regex that matches <Input ... type="password" ... />
  content = content.replace(/<Input([^>]*?)type="password"([^>]*?)\/>/gs, `<PasswordInput$1$2/>`);

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Patched", filePath);
}

patch("src/app/login/page.tsx");
patch("src/app/signup/page.tsx");
patch("src/app/update-password/page.tsx");

