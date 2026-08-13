# API Contract Guidelines

All customer-facing APIs and Service queries for products must adhere strictly to the following public data structure to prevent leakage of internal pricing:

```typescript
export interface PublicProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  stock_quantity: number;
  status: 'active' | 'draft' | 'archived';
  selling_price: number; // authoritative price calculated securely
  images?: string[];
}
```

**CRITICAL RULE:**
Never return `cost_price`, `target_margin`, or `profit` in any API route or Service function accessible by `CUSTOMER` or public users. These fields are exclusively reserved for Admin access and reside securely in the `product_pricing` table, which is protected by Supabase RLS.

## Excel Import Contract
For future bulk importing, the expected dataset maps identically to the seed format:
Name, Slug, Description, Category, Occasions, Cost Price, Target Margin, Stock Quantity, Image URL, Active Status.
