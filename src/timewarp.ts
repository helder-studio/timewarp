import type { StorageAdapter } from '@helder-studio/storage';
import {
  addDelta,
  freeze,
  initialState,
  isWarped,
  setTime,
  type TimewarpState,
  type TravelDelta,
  unfreeze,
  virtualNow,
} from './core/clock';
import { type PresetName, presetTime } from './core/presets';
import { assertTimeZone, isPatched, patch, RealDate, unpatch } from './patch';

export interface InstallOptions {
  /** Off: nothing is patched. Pass something like `__DEV__ || Config.QA_BUILD`. */
  enabled: boolean;
  /** Saves the warp so it survives restarts. Synchronous adapters (MMKV, localStorage) apply it before the first render. */
  storage?: StorageAdapter;
}

export interface SetOptions {
  /** ISO string (local time unless it has a zone), epoch ms or a Date. */
  now?: string | number | Date;
  /** BCP 47 tag like `'de-DE'`; `null` goes back to the device locale. */
  locale?: string | null;
  /** IANA zone for Intl formatting only; `getHours()` and friends keep the device zone. */
  experimental_timeZone?: string | null;
}

const KEY = 'helder-studio:timewarp';
const realNow = () => RealDate.now();

let state: TimewarpState = initialState;
let storage: StorageAdapter | undefined;
const listeners = new Set<() => void>();

function update(next: TimewarpState) {
  state = next;
  if (storage) {
    try {
      Promise.resolve(storage.setItem(KEY, JSON.stringify({ v: 1, ...state }))).catch(() => {});
    } catch {
      // Keep the warp in memory for this session.
    }
  }
  for (const listener of listeners) listener();
}

function load(raw: string | null) {
  try {
    const data = raw ? (JSON.parse(raw) as TimewarpState & { v?: number }) : undefined;
    if (data?.v !== 1) return;
    const { v: _v, ...saved } = data;
    state = { ...initialState, ...saved };
    for (const listener of listeners) listener();
  } catch {
    // Corrupt data: stay on real time.
  }
}

function isServer() {
  const g = globalThis as { document?: unknown; navigator?: { product?: string } };
  return g.document === undefined && g.navigator?.product !== 'ReactNative';
}

function toEpoch(value: string | number | Date): number {
  const time = value instanceof RealDate ? value.getTime() : new RealDate(value).getTime();
  if (Number.isNaN(time)) throw new RangeError(`Invalid time: ${String(value)}`);
  return time;
}

export const timewarp = {
  /**
   * Patches `Date`, Intl and `toLocale*String`. Call at the top of your entry file, before anything
   * captures `Date`. Never patches during server rendering.
   */
  install({ enabled, storage: adapter }: InstallOptions): void {
    if (!enabled || isServer() || isPatched()) return;
    patch(timewarp.now, () => state);
    console.warn('[timewarp] active: the app clock and locale may not be real.');
    if (!adapter) return;
    storage = adapter;
    let raw: string | null | Promise<string | null>;
    try {
      raw = adapter.getItem(KEY);
    } catch {
      raw = null;
    }
    if (typeof raw === 'string' || raw === null) load(raw);
    else raw.then(load, () => {});
  },

  /** Restores the real `Date` and Intl. Mostly for tests. */
  uninstall(): void {
    unpatch();
    storage = undefined;
  },

  /** The virtual time in epoch ms. */
  now: (): number => virtualNow(state, realNow()),
  getState: (): TimewarpState => state,
  isWarped: (): boolean => isWarped(state),
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  set(options: SetOptions): void {
    let next = state;
    if (options.now !== undefined) next = setTime(next, toEpoch(options.now), realNow());
    if (options.locale !== undefined) {
      if (options.locale !== null) Intl.getCanonicalLocales(options.locale); // throws on bad tags
      next = { ...next, locale: options.locale };
    }
    if (options.experimental_timeZone !== undefined) {
      if (options.experimental_timeZone !== null) assertTimeZone(options.experimental_timeZone);
      next = { ...next, timeZone: options.experimental_timeZone };
    }
    update(next);
  },

  /** Jumps relative to the virtual time; negative values go back. */
  travel(delta: TravelDelta): void {
    update(setTime(state, addDelta(timewarp.now(), delta, RealDate), realNow()));
  },

  preset(name: PresetName): void {
    const target = presetTime(name, timewarp.now(), RealDate);
    if (target !== null) update(setTime(state, target, realNow()));
  },

  /** Stops the clock at the current virtual time. */
  freeze: (): void => update(freeze(state, realNow())),
  /** Lets the clock run again from where it was frozen. */
  unfreeze: (): void => update(unfreeze(state, realNow())),

  /** Back to real time, device locale and zone. */
  reset: (): void => update(initialState),
};

export type Timewarp = typeof timewarp;
