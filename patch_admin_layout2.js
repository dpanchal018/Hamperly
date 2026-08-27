const fs = require('fs');
let content = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

content = content.replace(
  `<div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-rose-200">`,
  `<div className="flex flex-1 h-full overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-rose-200">`
);

fs.writeFileSync('src/app/admin/layout.tsx', content, 'utf8');
console.log('Patched AdminLayout again');
