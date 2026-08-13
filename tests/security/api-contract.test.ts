import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicProducts } from '@/services/catalog.service';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (cb: any) => cb({ 
        data: [{ 
          id: '1', 
          name: 'Public Product', 
          slug: 'public-product', 
          selling_price: 400, 
          status: 'active',
          // Simulate a malicious response if the backend was broken
          // cost_price: 300, 
          // target_margin: 0.25 
        }], 
        error: null 
      })
    }))
  }
}));

import { supabase } from '@/lib/supabase';

describe('Security: Customer-Safe API Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('guarantees public products response does not leak pricing data', async () => {
    const products = await getPublicProducts();
    const product = products[0];

    // Assert safe fields exist
    expect(product.id).toBeDefined();
    expect(product.name).toBeDefined();
    expect(product.selling_price).toBeDefined();

    // Assert sensitive fields DO NOT exist
    expect((product as any).cost_price).toBeUndefined();
    expect((product as any).target_margin).toBeUndefined();
    expect((product as any).profit).toBeUndefined();

    // Verify the query being executed is constrained
    const fromMock = vi.mocked(supabase.from);
    const mockChain = fromMock.mock.results[0].value;
    const selectArg = mockChain.select.mock.calls[0][0];
    
    // Ensure the query specifically omits sensitive fields by explicitly selecting safe ones
    expect(selectArg).not.toContain('cost_price');
    expect(selectArg).not.toContain('target_margin');
    expect(selectArg).not.toContain('*');
    expect(selectArg).toContain('selling_price');
  });
});
