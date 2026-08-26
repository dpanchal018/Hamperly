const fs = require('fs');
let content = fs.readFileSync('src/types/database.types.ts', 'utf8');

content = content.replace(
  `address: string | null;`,
  `address: string | null;
  pincode: string | null;`
);

fs.writeFileSync('src/types/database.types.ts', content, 'utf8');
console.log('Types patched');
