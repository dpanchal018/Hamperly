import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setProductPricing } from '@/services/admin.service';
import * as authService from '@/services/auth.service';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { product_id: '123', cost_price: 100, target_margin: 0.2 }, error: null })
        }))
      }))
    }))
  }
}));

describe('Admin Service Security Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects pricing update if user is not admin', async () => {
    vi.spyOn(authService, 'requireAdmin').mockRejectedValue(new Error('Unauthorized: Admin access required'));

    await expect(setProductPricing('123', 100, 0.2)).rejects.toThrow('Unauthorized: Admin access required');
  });

  it('rejects pricing update if margin is negative', async () => {
    vi.spyOn(authService, 'requireAdmin').mockResolvedValue(true);

    await expect(setProductPricing('123', 100, -0.1)).rejects.toThrow('Invalid target margin. Must be between 0 and 0.99');
  });

  it('rejects pricing update if margin is 100% or greater', async () => {
    vi.spyOn(authService, 'requireAdmin').mockResolvedValue(true);

    await expect(setProductPricing('123', 100, 1.2)).rejects.toThrow('Invalid target margin. Must be between 0 and 0.99');
  });

  it('allows pricing update if user is admin and bounds are correct', async () => {
    vi.spyOn(authService, 'requireAdmin').mockResolvedValue(true);

    const result = await setProductPricing('123', 100, 0.2);
    expect(result.cost_price).toBe(100);
  });
});
