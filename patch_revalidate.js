const fs = require('fs');
let content = fs.readFileSync('src/actions/purchase.actions.ts', 'utf8');

content = content.replace(
  `revalidatePath('/admin/customers-purchases');
    revalidatePath(\`/admin/customers-purchases/\${purchaseId}\`);`,
  `revalidatePath('/admin/customers-purchases');
    revalidatePath(\`/admin/customers-purchases/\${purchaseId}\`);
    revalidatePath('/admin');`
);

content = content.replace(
  `revalidatePath('/admin/customers-purchases');
  revalidatePath(\`/admin/customers-purchases/\${purchaseId}\`);`,
  `revalidatePath('/admin/customers-purchases');
  revalidatePath(\`/admin/customers-purchases/\${purchaseId}\`);
  revalidatePath('/admin');`
);

content = content.replace(
  `revalidatePath('/admin/customers-purchases');
  return { purchase };`,
  `revalidatePath('/admin/customers-purchases');
  revalidatePath('/admin');
  return { purchase };`
);

fs.writeFileSync('src/actions/purchase.actions.ts', content, 'utf8');
console.log('Patched revalidatePath');
