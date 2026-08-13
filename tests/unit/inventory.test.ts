import { describe, it, expect } from 'vitest';
import { getInventoryStatus, getInventoryStatusColor } from '@/lib/inventory';

describe('Inventory Utility', () => {
  it('returns OUT OF STOCK for 0', () => {
    expect(getInventoryStatus(0)).toBe('OUT OF STOCK');
    expect(getInventoryStatusColor('OUT OF STOCK')).toContain('red-600');
  });

  it('returns OUT OF STOCK for negative values', () => {
    expect(getInventoryStatus(-5)).toBe('OUT OF STOCK');
  });

  it('returns CRITICAL for 1-2', () => {
    expect(getInventoryStatus(1)).toBe('CRITICAL');
    expect(getInventoryStatus(2)).toBe('CRITICAL');
    expect(getInventoryStatusColor('CRITICAL')).toContain('orange-600');
  });

  it('returns LOW STOCK for 3-5', () => {
    expect(getInventoryStatus(3)).toBe('LOW STOCK');
    expect(getInventoryStatus(5)).toBe('LOW STOCK');
    expect(getInventoryStatusColor('LOW STOCK')).toContain('yellow-600');
  });

  it('returns IN STOCK for 6+', () => {
    expect(getInventoryStatus(6)).toBe('IN STOCK');
    expect(getInventoryStatus(10)).toBe('IN STOCK');
    expect(getInventoryStatus(100)).toBe('IN STOCK');
    expect(getInventoryStatusColor('IN STOCK')).toContain('green-600');
  });
});
