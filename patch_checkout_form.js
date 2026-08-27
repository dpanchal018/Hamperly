const fs = require('fs');
let content = fs.readFileSync('src/components/customer/CheckoutForm.tsx', 'utf8');

content = content.replace(/item\.product\.name/g, 'item.name');
content = content.replace(/item\.product\.selling_price/g, 'item.price');

fs.writeFileSync('src/components/customer/CheckoutForm.tsx', content, 'utf8');
console.log('Fixed CheckoutForm.tsx types');
