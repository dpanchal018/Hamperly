const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!content.includes('WishlistProvider')) {
  content = content.replace(
    `import {CartProvider} from "@/contexts/CartContext";`,
    `import {CartProvider} from "@/contexts/CartContext";\nimport {WishlistProvider} from "@/contexts/WishlistContext";`
  );
  
  content = content.replace(
    `<CartProvider userId={userId}>{children}</CartProvider>`,
    `<WishlistProvider userId={userId}>\n          <CartProvider userId={userId}>{children}</CartProvider>\n        </WishlistProvider>`
  );
  
  fs.writeFileSync('src/app/layout.tsx', content, 'utf8');
  console.log('Added WishlistProvider');
}
