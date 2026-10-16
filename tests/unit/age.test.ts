import { describe, it, expect } from 'vitest';
import { ageOn, todayInIndia } from '@/lib/age';

describe('ageOn', () => {
  it('turns 18 on the birthday itself', () => {
    expect(ageOn('2008-10-08', '2026-10-08')).toBe(18);
  });

  it('is still 17 the day before the 18th birthday', () => {
    expect(ageOn('2008-10-09', '2026-10-08')).toBe(17);
  });

  it('counts a 29 February birthday as reached on 1 March in a non-leap year', () => {
    expect(ageOn('2008-02-29', '2026-02-28')).toBe(17);
    expect(ageOn('2008-02-29', '2026-03-01')).toBe(18);
  });

  it('rejects impossible, malformed and future dates', () => {
    expect(ageOn('2001-02-30', '2026-10-08')).toBeNull();
    expect(ageOn('08/10/2001', '2026-10-08')).toBeNull();
    expect(ageOn('', '2026-10-08')).toBeNull();
    expect(ageOn('2030-01-01', '2026-10-08')).toBeNull();
    expect(ageOn('1850-01-01', '2026-10-08')).toBeNull();
  });
});

describe('todayInIndia', () => {
  it('rolls over to the next date at midnight IST, not UTC', () => {
    expect(todayInIndia(new Date('2026-10-07T18:29:00Z'))).toBe('2026-10-07');
    expect(todayInIndia(new Date('2026-10-07T18:30:00Z'))).toBe('2026-10-08');
  });
});
