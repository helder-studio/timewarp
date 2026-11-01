import { memory } from '@helder-studio/storage';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RealDate } from './patch';
import { timewarp } from './timewarp';

const HOUR = 3_600_000;

beforeEach(() => {
  vi.stubGlobal('document', {}); // looks like a browser, so install() patches
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  timewarp.install({ enabled: true });
});

afterEach(() => {
  timewarp.reset();
  timewarp.uninstall();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Date patch', () => {
  it('moves new Date() and Date.now() together', () => {
    timewarp.set({ now: '2030-06-15T10:00:00Z' });
    expect(new Date().toISOString().slice(0, 13)).toBe('2030-06-15T10');
    expect(Math.abs(Date.now() - RealDate.UTC(2030, 5, 15, 10))).toBeLessThan(1000);
  });

  it('keeps Date working like Date', () => {
    timewarp.set({ now: '2030-06-15T10:00:00Z' });
    const d = new Date();
    expect(d instanceof Date).toBe(true);
    expect(new RealDate() instanceof Date).toBe(true);
    expect(Object.prototype.toString.call(d)).toBe('[object Date]');
    expect(Date.UTC(2020, 0, 1)).toBe(1577836800000);
    expect(Date.parse('2020-01-01T00:00:00Z')).toBe(1577836800000);
    expect(new Date(2020, 0, 1, 12).getHours()).toBe(12);
    expect(new Date(0).getTime()).toBe(0);
    expect(new Date(JSON.parse(JSON.stringify({ d })).d).getTime()).toBe(d.getTime());
    expect([Date.name, Date.length]).toEqual(['Date', 7]);
    expect(typeof Date()).toBe('string');
    expect(Date()).toContain('2030');
    class Sub extends Date {}
    expect(new Sub() instanceof Date).toBe(true);
    expect(new Sub().getUTCFullYear()).toBe(2030);
  });

  it('travels relative to the virtual time', () => {
    timewarp.set({ now: '2030-06-15T10:00:00Z' });
    const before = Date.now();
    timewarp.travel({ days: 1 });
    expect(Date.now() - before).toBeGreaterThanOrEqual(24 * HOUR - 1000);
    expect(Date.now() - before).toBeLessThan(24 * HOUR + 1000);
    timewarp.travel({ hours: -2 });
    expect(Date.now() - before).toBeLessThan(22 * HOUR + 1000);
  });

  it('freezes the clock so time stands still', async () => {
    timewarp.freeze();
    const a = Date.now();
    await new Promise((r) => setTimeout(r, 20));
    expect(Date.now()).toBe(a);
    // biome-ignore lint/complexity/useDateNow: checks the constructor path, not Date.now
    expect(new Date().getTime()).toBe(a);
    timewarp.unfreeze();
    await new Promise((r) => setTimeout(r, 20));
    expect(Date.now()).toBeGreaterThan(a);
  });

  it('applies presets and resets to real time', () => {
    timewarp.preset('end-of-year');
    expect(new Date().getMonth()).toBe(11);
    expect(new Date().getDate()).toBe(31);
    expect(timewarp.isWarped()).toBe(true);
    timewarp.reset();
    expect(Math.abs(Date.now() - RealDate.now())).toBeLessThan(50);
    expect(timewarp.isWarped()).toBe(false);
  });

  it('rejects invalid times', () => {
    expect(() => timewarp.set({ now: 'not a date' })).toThrow(RangeError);
  });
});

describe('locale and time zone', () => {
  it('injects the locale only when the caller passes none', () => {
    timewarp.set({ locale: 'de-DE' });
    expect(new Intl.DateTimeFormat().resolvedOptions().locale).toBe('de-DE');
    expect(Intl.DateTimeFormat().resolvedOptions().locale).toBe('de-DE');
    expect(new Intl.NumberFormat().format(1234.5)).toBe('1.234,5');
    expect((1234.5).toLocaleString()).toBe('1.234,5');
    expect(
      new Date(Date.UTC(2026, 11, 31, 12)).toLocaleDateString(undefined, { timeZone: 'UTC' }),
    ).toBe('31.12.2026');
    expect((1234.5).toLocaleString('en-US')).toBe('1,234.5');
    expect(new Intl.DateTimeFormat() instanceof Intl.DateTimeFormat).toBe(true);
    expect(Intl.DateTimeFormat.supportedLocalesOf(['de-DE'])).toEqual(['de-DE']);
  });

  it('injects an experimental time zone into formatting', () => {
    timewarp.set({ experimental_timeZone: 'Asia/Tokyo' });
    const noonUtc = new Date(Date.UTC(2026, 0, 1, 12));
    expect(noonUtc.toLocaleTimeString('en-GB')).toBe('21:00:00');
    expect(new Intl.DateTimeFormat('en-GB', { hour: '2-digit' }).format(noonUtc)).toBe('21');
    expect(noonUtc.toLocaleTimeString('en-GB', { timeZone: 'UTC' })).toBe('12:00:00');
  });

  it('rejects unknown locales and zones', () => {
    expect(() => timewarp.set({ locale: 'not_a-locale!' })).toThrow(RangeError);
    expect(() => timewarp.set({ experimental_timeZone: 'Mars/Olympus' })).toThrow(RangeError);
  });
});

describe('install', () => {
  it('does nothing when disabled, on the server, or twice', () => {
    timewarp.uninstall();
    timewarp.install({ enabled: false });
    expect(Date).toBe(RealDate);
    vi.stubGlobal('document', undefined);
    timewarp.install({ enabled: true });
    expect(Date).toBe(RealDate);
    vi.stubGlobal('document', {});
    timewarp.install({ enabled: true });
    const patched = Date;
    timewarp.install({ enabled: true });
    expect(Date).toBe(patched);
    timewarp.uninstall();
    expect(Date).toBe(RealDate);
    expect((1234.5).toLocaleString('de-DE')).toBe('1.234,5');
  });

  it('restores the warp from storage after a restart', () => {
    timewarp.uninstall();
    const storage = memory();
    timewarp.install({ enabled: true, storage });
    timewarp.set({ now: '2031-01-01T00:00:00Z', locale: 'fr-FR' });
    timewarp.freeze();
    timewarp.uninstall();

    timewarp.reset(); // in-memory state gone, as after a restart (storage detached)
    timewarp.install({ enabled: true, storage });
    expect(new Date().toISOString()).toBe('2031-01-01T00:00:00.000Z');
    expect(timewarp.getState().locale).toBe('fr-FR');
  });

  it('notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = timewarp.subscribe(listener);
    timewarp.travel({ minutes: 5 });
    unsubscribe();
    timewarp.travel({ minutes: 5 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('experimental time zone getters', () => {
  const at = (...args: Parameters<typeof Date.UTC>) => new Date(Date.UTC(...args));

  it('follows Europe/Amsterdam across the spring-forward change', () => {
    timewarp.set({ experimental_timeZone: 'Europe/Amsterdam' });
    const before = at(2026, 2, 29, 0, 59);
    const after = at(2026, 2, 29, 1, 0);
    expect([before.getHours(), before.getMinutes(), before.getTimezoneOffset()]).toEqual([
      1, 59, -60,
    ]);
    expect([after.getHours(), after.getMinutes(), after.getTimezoneOffset()]).toEqual([3, 0, -120]);
  });

  it('follows America/New_York across the fall-back change', () => {
    timewarp.set({ experimental_timeZone: 'America/New_York' });
    const before = at(2026, 10, 1, 5, 59);
    const after = at(2026, 10, 1, 6, 0);
    expect([before.getHours(), before.getTimezoneOffset()]).toEqual([1, 240]);
    expect([after.getHours(), after.getTimezoneOffset()]).toEqual([1, 300]);
    expect([after.getFullYear(), after.getMonth(), after.getDate(), after.getDay()]).toEqual([
      2026, 10, 1, 0,
    ]);
  });

  it('reads the calendar date in the zone and leaves UTC getters alone', () => {
    timewarp.set({ experimental_timeZone: 'Asia/Tokyo' });
    const d = at(2026, 11, 31, 20, 0); // 1 Jan 05:00 in Tokyo
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2027, 0, 1, 5]);
    expect(d.getUTCHours()).toBe(20);
    expect(Number.isNaN(new Date(Number.NaN).getHours())).toBe(true);
    timewarp.set({ experimental_timeZone: null });
    expect(d.getHours()).toBe(new RealDate(d.getTime()).getHours());
  });

  it('keeps travel and presets in the device zone', () => {
    timewarp.set({ now: '2030-06-15T10:00:00Z', experimental_timeZone: 'Asia/Tokyo' });
    const before = Date.now();
    timewarp.travel({ days: 1 });
    expect(Math.round((Date.now() - before) / HOUR)).toBe(24);
  });
});
