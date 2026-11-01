import { afterAll, describe, expect, it } from 'vitest';
import { addDelta, freeze, initialState, isWarped, setTime, unfreeze, virtualNow } from './clock';
import { nextOffsetChange, presetTime } from './presets';

declare const process: { env: Record<string, string | undefined> };

const originalTz = process.env.TZ;
// Set before any describe body runs: fixtures below are computed at collection time.
process.env.TZ = 'Europe/Amsterdam';
afterAll(() => {
  process.env.TZ = originalTz;
});

const at = (iso: string) => new Date(iso).getTime();

describe('clock', () => {
  it('runs with an offset and stands still when frozen', () => {
    const moved = setTime(initialState, 10_000, 1_000);
    expect(virtualNow(moved, 1_000)).toBe(10_000);
    expect(virtualNow(moved, 2_000)).toBe(11_000);
    const frozen = freeze(moved, 2_000);
    expect(virtualNow(frozen, 50_000)).toBe(11_000);
    expect(virtualNow(setTime(frozen, 5, 50_000), 99_000)).toBe(5);
    const running = unfreeze(frozen, 60_000);
    expect(virtualNow(running, 61_000)).toBe(12_000);
    expect(freeze(frozen, 0)).toBe(frozen);
    expect(unfreeze(running, 0)).toBe(running);
  });

  it('knows when anything is warped', () => {
    expect(isWarped(initialState)).toBe(false);
    expect(isWarped({ ...initialState, locale: 'de-DE' })).toBe(true);
    expect(isWarped({ ...initialState, frozenAt: 1 })).toBe(true);
  });

  it('adds months without overflowing short months', () => {
    expect(new Date(addDelta(at('2026-01-31T10:00:00'), { months: 1 })).toString()).toContain(
      'Sat Feb 28 2026 10:00:00',
    );
    expect(new Date(addDelta(at('2028-01-31T10:00:00'), { months: 1 })).getDate()).toBe(29);
    expect(
      new Date(addDelta(at('2026-03-15T10:00:00'), { years: -1, months: -3 })).toString(),
    ).toContain('Sun Dec 15 2024');
  });

  it('keeps the wall-clock time when a day crosses a DST change', () => {
    const before = at('2026-03-28T12:00:00'); // day before clocks go forward
    const next = addDelta(before, { days: 1 });
    expect(new Date(next).getHours()).toBe(12);
    expect(next - before).toBe(23 * 3_600_000);
    expect(addDelta(before, { hours: 24 }) - before).toBe(24 * 3_600_000);
  });
});

describe('presets', () => {
  const from = at('2026-11-01T15:30:00');

  it.each([
    ['tomorrow', 'Mon Nov 02 2026 15:30:00'],
    ['next-week', 'Sun Nov 08 2026 15:30:00'],
    ['end-of-day', 'Sun Nov 01 2026 23:59:00'],
    ['end-of-month', 'Mon Nov 30 2026 23:59:00'],
    ['end-of-year', 'Thu Dec 31 2026 23:58:00'],
  ] as const)('%s', (name, expected) => {
    expect(new Date(presetTime(name, from) as number).toString()).toContain(expected);
  });

  it('finds the next DST change in Europe/Amsterdam', () => {
    expect(new Date(nextOffsetChange(from) as number).toISOString()).toBe(
      '2027-03-28T01:00:00.000Z',
    );
    expect(new Date(presetTime('next-dst', from) as number).toISOString()).toBe(
      '2027-03-28T00:59:00.000Z',
    );
  });

  it('finds the next DST change in America/New_York', () => {
    process.env.TZ = 'America/New_York';
    try {
      expect(new Date(nextOffsetChange(at('2026-10-31T12:00:00Z')) as number).toISOString()).toBe(
        '2026-11-01T06:00:00.000Z',
      );
      expect(new Date(nextOffsetChange(at('2027-01-10T12:00:00Z')) as number).toISOString()).toBe(
        '2027-03-14T07:00:00.000Z',
      );
    } finally {
      process.env.TZ = 'Europe/Amsterdam';
    }
  });

  it('returns null in a zone without DST', () => {
    process.env.TZ = 'UTC';
    try {
      expect(nextOffsetChange(from)).toBe(null);
      expect(presetTime('next-dst', from)).toBe(null);
    } finally {
      process.env.TZ = 'Europe/Amsterdam';
    }
  });
});
