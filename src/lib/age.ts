export const MINIMUM_AGE = 18;

// Calendar date in India, as YYYY-MM-DD, so the cutoff doesn't depend on the server's time zone
export function todayInIndia(now: Date = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

// Whole years between a YYYY-MM-DD birth date and today; null for malformed, impossible or future dates
export function ageOn(dateOfBirth: string, today: string): number | null {
  const parse = (s: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(Date.UTC(y, mo - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
    return { y, mo, d };
  };

  const birth = parse(dateOfBirth);
  const now = parse(today);
  if (!birth || !now) return null;

  let age = now.y - birth.y;
  if (now.mo < birth.mo || (now.mo === birth.mo && now.d < birth.d)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}
