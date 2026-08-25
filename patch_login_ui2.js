const fs = require("fs");
let c = fs.readFileSync("src/app/login/page.tsx", "utf8");

c = c.replace(
  /<\/div>\s*<SubmitButton/,
  `</div>
            
            <div className="flex items-center space-x-2 mt-4 mb-2">
              <Checkbox id="keepLoggedIn" name="keepLoggedIn" defaultChecked value="on" />
              <label htmlFor="keepLoggedIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600">
                Keep me logged in
              </label>
            </div>
            
            <SubmitButton`
);

// We need to add the import if it failed earlier too
if (!c.includes("import { Checkbox }")) {
  c = c.replace(
    "import { Input } from '@/components/ui/input'",
    "import { Input } from '@/components/ui/input'\nimport { Checkbox } from '@/components/ui/checkbox'"
  );
}

fs.writeFileSync("src/app/login/page.tsx", c, "utf8");
console.log("Patched login UI 2");
