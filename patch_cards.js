const fs = require('fs');

function addWishlistToCard(file, type) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('WishlistButton')) {
    // Add import
    content = content.replace(
      `import { getInventoryStatus } from '@/lib/inventory';`,
      `import { getInventoryStatus } from '@/lib/inventory';\nimport { WishlistButton } from '@/components/customer/WishlistButton';`
    );
    
    // Add inside relative wrapper. Look for <div className="relative...
    // Actually look for <Image
    content = content.replace(
      /(<div className="relative aspect-square overflow-hidden bg-slate-50">)/,
      `$1\n        <WishlistButton itemId={${type === 'HAMPER' ? 'hamper' : 'product'}.id} itemType="${type}" />`
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added WishlistButton to ${file}`);
  }
}

addWishlistToCard('src/components/customer/HamperCard.tsx', 'HAMPER');
addWishlistToCard('src/components/customer/ProductCard.tsx', 'PRODUCT');
