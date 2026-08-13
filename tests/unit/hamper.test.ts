import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addHamperItem } from '@/services/hamper.service';
import * as catalogService from '@/services/catalog.service';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'item1', hamper_id: 'h1', product_id: 'p1', quantity: 2, unit_price: 150 }, 
            error: null 
          })
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { total_price: 0 }, error: null })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    }))
  }
}));

describe('Hamper Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects adding item with 0 quantity', async () => {
    await expect(addHamperItem('h1', 'p1', 0)).rejects.toThrow('Quantity must be greater than 0');
  });

  it('rejects adding item if product is not found or inactive', async () => {
    vi.spyOn(catalogService, 'getProductById').mockResolvedValue(null);
    await expect(addHamperItem('h1', 'p1', 1)).rejects.toThrow('Product not found or not active');
  });

  it('captures authoritative unit price snapshot from database', async () => {
    vi.spyOn(catalogService, 'getProductById').mockResolvedValue({
      id: 'p1',
      category_id: 'c1',
      name: 'Product 1',
      slug: 'product-1',
      description: 'Desc',
      stock_quantity: 10,
      status: 'active',
      selling_price: 150,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const result = await addHamperItem('h1', 'p1', 2);
    expect(result.unit_price).toBe(150);
  });
});
