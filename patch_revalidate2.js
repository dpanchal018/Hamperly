const fs = require('fs');
let content = fs.readFileSync('src/actions/purchase.actions.ts', 'utf8');

// Replace all occurrences of revalidatePath('/admin/customers-purchases')
// to also revalidatePath('/admin')
content = content.replace(/revalidatePath\('\/admin\/customers-purchases'\);/g, "revalidatePath('/admin/customers-purchases');\n  revalidatePath('/admin');");

fs.writeFileSync('src/actions/purchase.actions.ts', content, 'utf8');
console.log('Patched revalidatePath globally');
