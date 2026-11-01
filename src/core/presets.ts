import { addDelta } from './clock';

export type PresetName =
  | 'tomorrow'
  | 'next-week'
  | 'end-of-day'
  | 'end-of-month'
  | 'end-of-year'
  | 'next-dst';

/**
 * Target time for a preset, computed in the device's local zone from the current virtual time.
 * `null` when there is no such moment (no DST change in the next 400 days).
 */
export function presetTime(
  name: PresetName,
  from: number,
  RealDate: DateConstructor = Date,
): number | null {
  const d = new RealDate(from);
  switch (name) {
    case 'tomorrow':
      return addDelta(from, { days: 1 }, RealDate);
    case 'next-week':
      return addDelta(from, { weeks: 1 }, RealDate);
    case 'end-of-day':
      return new RealDate(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).getTime();
    case 'end-of-month':
      return new RealDate(d.getFullYear(), d.getMonth() + 1, 0, 23, 59).getTime();
    case 'end-of-year':
      return new RealDate(d.getFullYear(), 11, 31, 23, 58).getTime();
    case 'next-dst': {
      const change = nextOffsetChange(from, RealDate);
      return change === null ? null : change - 60_000;
    }
  }
}

const HOUR = 3_600_000;

/** First instant after `from` where the local UTC offset changes, to the minute. */
export function nextOffsetChange(from: number, RealDate: DateConstructor = Date): number | null {
  const offset = (t: number) => new RealDate(t).getTimezoneOffset();
  const start = offset(from);
  let lo = from;
  let hi = from;
  // ponytail: 6-hour steps can miss a change that reverts within 6 hours; no real zone does that.
  for (let step = 0; step < 400 * 4; step++) {
    hi = lo + 6 * HOUR;
    if (offset(hi) !== start) break;
    lo = hi;
    if (step === 400 * 4 - 1) return null;
  }
  while (hi - lo > 60_000) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (offset(mid) === start) lo = mid;
    else hi = mid;
  }
  // Offsets change on whole minutes: the change is the minute at or just before `hi`.
  const minute = Math.floor(hi / 60_000) * 60_000;
  return offset(minute) !== start ? minute : minute + 60_000;
}
