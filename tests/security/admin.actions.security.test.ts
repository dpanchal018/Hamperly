import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductAction, updateProductAction } from '@/actions/admin.products.actions';
import * as authService from '@/services/auth.service';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { product_id: '123' }, error: null })
        }))
      }))
    }))
  }
}));

// Mock Next.js cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

describe('Admin Server Actions Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createProductAction rejects unauthorized users', async () => {
    vi.spyOn(authService, 'requireAdmin').mockRejectedValue(new Error('Unauthorized: Admin access required'));

    const formData = new FormData();
    formData.append('name', 'Test');
    formData.append('slug', 'test');
    formData.append('category_id', 'c1');
    formData.append('cost_price', '100');
    formData.append('target_margin', '0.2');

    await expect(createProductAction(formData)).rejects.toThrow('Unauthorized: Admin access required');
  });

  it('updateProductAction rejects unauthorized users', async () => {
    vi.spyOn(authService, 'requireAdmin').mockRejectedValue(new Error('Unauthorized: Admin access required'));

    const formData = new FormData();
    formData.append('name', 'Test');
    formData.append('slug', 'test');
    formData.append('category_id', 'c1');
    formData.append('cost_price', '100');
    formData.append('target_margin', '0.2');

    await expect(updateProductAction('123', formData)).rejects.toThrow('Unauthorized: Admin access required');
  });
  
  it('createProductAction fails if margin is negative', async () => {
    vi.spyOn(authService, 'requireAdmin').mockResolvedValue(true);

    const formData = new FormData();
    formData.append('name', 'Test');
    formData.append('slug', 'test');
    formData.append('category_id', 'c1');
    formData.append('cost_price', '100');
    formData.append('target_margin', '-0.5'); // negative

    await expect(createProductAction(formData)).rejects.toThrow('Invalid target margin');
  });
});
