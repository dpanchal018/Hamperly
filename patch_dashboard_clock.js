const fs = require("fs");
let c = fs.readFileSync("src/app/admin/page.tsx", "utf8");

if (!c.includes("import { LiveClock }")) {
  c = c.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport { LiveClock } from '@/components/ui/LiveClock';"
  );
}

const targetHeader = `<h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-serif">Business Intelligence</h1>
          <p className="text-slate-500 mt-1">Real-time metrics and operational analytics for Hamperly.</p>`;

const newHeader = `<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-serif">Business Intelligence</h1>
              <p className="text-slate-500 mt-1">Real-time metrics and operational analytics for Hamperly.</p>
            </div>
            <LiveClock />
          </div>`;

c = c.replace(targetHeader, newHeader);

fs.writeFileSync("src/app/admin/page.tsx", c, "utf8");
console.log("Patched admin page with clock");
