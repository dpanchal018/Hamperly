const fs = require('fs');
let content = fs.readFileSync('src/types/database.types.ts', 'utf8');

if (!content.includes('cart_state:')) {
  content = content.replace(
    `pincode: string | null;`,
    `pincode: string | null;
    cart_state: any | null;`
  );
  fs.writeFileSync('src/types/database.types.ts', content, 'utf8');
  console.log('Types patched for cart_state');
} else {
  console.log('cart_state already in types');
}
