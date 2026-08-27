const fs = require('fs');
let content = fs.readFileSync('src/actions/checkout.actions.ts', 'utf8');

content = content.replace(/item\.product\.name/g, 'item.name');

fs.writeFileSync('src/actions/checkout.actions.ts', content, 'utf8');
console.log('Fixed checkout.actions.ts types');
