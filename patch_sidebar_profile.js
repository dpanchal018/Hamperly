const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminSidebar.tsx', 'utf8');

content = content.replace(
  `<div className="p-4 border-t border-slate-50 flex items-center justify-between h-[72px]">`,
  `<div className="p-4 border-t border-slate-50 flex items-center justify-between h-[72px] w-[260px]">`
);

content = content.replace(
  `<div className="p-3">
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors duration-200">`,
  `<div className="p-3 w-[260px]">
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors duration-200">`
);

fs.writeFileSync('src/components/admin/AdminSidebar.tsx', content, 'utf8');
console.log('Patched AdminSidebar Profile section');
