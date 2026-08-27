const fs = require('fs');
let content = fs.readFileSync('src/app/(customer)/account/layout.tsx', 'utf8');

if (!content.includes('href="/account/wishlist"')) {
  content = content.replace(
    `href: "/account/orders" },`,
    `href: "/account/orders" },\n    { name: "My Wishlist", href: "/account/wishlist" },`
  );
  fs.writeFileSync('src/app/(customer)/account/layout.tsx', content, 'utf8');
  console.log('Added wishlist link to account sidebar');
}
