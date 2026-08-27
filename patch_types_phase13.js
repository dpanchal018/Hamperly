const fs = require('fs');
let content = fs.readFileSync('src/types/database.types.ts', 'utf8');

// 1. Update NotificationType
content = content.replace(
  `export type NotificationType = 'ORDER_PLACED' | 'ORDER_UPDATE' | 'PAYMENT_RECEIVED' | 'SYSTEM_ALERT';`,
  `export type NotificationType = 'ORDER_PLACED' | 'ORDER_UPDATE' | 'PAYMENT_RECEIVED' | 'SYSTEM_ALERT' | 'HAMPER_READY' | 'DELIVERY_UPDATE' | 'PROMOTION' | 'NEW_COLLECTION' | 'EXHIBITION';`
);

// 2. Add Wishlist interface
const wishlistInterface = `
export interface Wishlist {
  id: string;
  user_id: string;
  hamper_id: string | null;
  product_id: string | null;
  created_at: string;
}
`;

if (!content.includes('export interface Wishlist')) {
  content += wishlistInterface;
}

fs.writeFileSync('src/types/database.types.ts', content, 'utf8');
console.log('Types patched for Phase 13');
