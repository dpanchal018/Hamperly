const fs = require('fs');
let content = fs.readFileSync('src/app/admin/customers/page.tsx', 'utf8');

if (!content.includes('BroadcastButton')) {
  content = content.replace(
    `import { AutoRefresh } from '@/components/admin/AutoRefresh';`,
    `import { AutoRefresh } from '@/components/admin/AutoRefresh';\nimport { BroadcastButton } from '@/components/admin/BroadcastButton';`
  );
  
  content = content.replace(
    `{/* Placeholder for Broadcast feature to be added next */}`,
    `<BroadcastButton />`
  );
  
  fs.writeFileSync('src/app/admin/customers/page.tsx', content, 'utf8');
  console.log('Added BroadcastButton to customers page');
}
