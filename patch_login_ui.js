const fs = require("fs");
let c = fs.readFileSync("src/app/login/page.tsx", "utf8");

// Add Checkbox import
c = c.replace(
  "import { Input } from '@/components/ui/input'",
  "import { Input } from '@/components/ui/input'\nimport { Checkbox } from '@/components/ui/checkbox'"
);

// Add the checkbox UI
const target = "            </div>\n            <SubmitButton";
const replacement = `            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="keepLoggedIn" name="keepLoggedIn" defaultChecked />
              <label htmlFor="keepLoggedIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600">
                Keep me logged in
              </label>
            </div>
            
            <SubmitButton`;

c = c.replace(target, replacement);

fs.writeFileSync("src/app/login/page.tsx", c, "utf8");
console.log("Patched login UI");
