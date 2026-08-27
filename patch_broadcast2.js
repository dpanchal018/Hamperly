const fs = require('fs');
let content = fs.readFileSync('src/components/admin/BroadcastButton.tsx', 'utf8');

content = content.replace(
  `const { data: customers } = await supabase.from('customers').select('user_id').not('user_id', 'is', null);`,
  `const { data: customers } = await supabase.from('customers').select('id, user_id').not('user_id', 'is', null);`
);

content = content.replace(
  `user_id: c.user_id,`,
  `customer_id: c.id,`
);

fs.writeFileSync('src/components/admin/BroadcastButton.tsx', content, 'utf8');
console.log('Fixed BroadcastButton schema reference');
