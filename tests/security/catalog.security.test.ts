import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicProducts } from '@/services/catalog.service';

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gt: vi.fn().mockResolvedValue({ 
    data: [{ id: '123', name: 'Product', selling_price: 100 }], 
    error: null 
  }),
  then: vi.fn((resolve) => resolve({ data: [{ id: '123', name: 'Product', selling_price: 100 }], error: null })) // For await support
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain)
  }
}));

import { supabase } from '@/lib/supabase';

describe('Catalog Service Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPublicProducts never requests cost_price or target_margin', async () => {
    await getPublicProducts();

    const fromMock = vi.mocked(supabase.from);
    expect(fromMock).toHaveBeenCalledWith('products');
    
    const selectArg = mockChain.select.mock.calls[0][0];
    
    expect(selectArg).not.toContain('cost_price');
    expect(selectArg).not.toContain('target_margin');
    expect(selectArg).toContain('selling_price');
    expect(selectArg).toContain('stock_quantity');
  });
});
