export interface TimewarpState {
  /** Virtual minus real time, in ms, while the clock runs. */
  offsetMs: number;
  /** Epoch ms the clock is stopped at, or `null` while it runs. */
  frozenAt: number | null;
  /** Default locale injected into Intl and `toLocale*String` when the caller passes none. */
  locale: string | null;
  /** Experimental: default `timeZone` for Intl formatting. Date getters keep the device zone. */
  timeZone: string | null;
  /** Pseudo-localize strings passed through the i18n adapters (`[Ŝéţţîñĝš ···]`). */
  pseudo: boolean;
  /** Right-to-left layout (web: `dir="rtl"`; React Native: `I18nManager`, needs a reload). */
  rtl: boolean;
}

export const initialState: TimewarpState = {
  offsetMs: 0,
  frozenAt: null,
  locale: null,
  timeZone: null,
  pseudo: false,
  rtl: false,
};

export interface TravelDelta {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export function virtualNow(state: TimewarpState, realNow: number): number {
  return state.frozenAt ?? realNow + state.offsetMs;
}

export function isWarped(state: TimewarpState): boolean {
  return (
    state.offsetMs !== 0 ||
    state.frozenAt !== null ||
    state.locale !== null ||
    state.timeZone !== null ||
    state.pseudo ||
    state.rtl
  );
}

/** Moves the virtual clock to `target`, keeping it frozen if it was. */
export function setTime(state: TimewarpState, target: number, realNow: number): TimewarpState {
  return state.frozenAt === null
    ? { ...state, offsetMs: target - realNow }
    : { ...state, frozenAt: target };
}

/**
 * Calendar-aware jump in local time: `{ months: 1 }` from 31 Jan lands on the last day of February,
 * `{ days: 1 }` keeps the wall-clock time across DST changes.
 */
export function addDelta(
  from: number,
  delta: TravelDelta,
  RealDate: DateConstructor = Date,
): number {
  const d = new RealDate(from);
  if (delta.years || delta.months) {
    const day = d.getDate();
    d.setDate(1);
    d.setFullYear(d.getFullYear() + (delta.years ?? 0), d.getMonth() + (delta.months ?? 0));
    const lastDay = new RealDate(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
  }
  if (delta.weeks || delta.days)
    d.setDate(d.getDate() + (delta.weeks ?? 0) * 7 + (delta.days ?? 0));
  const ms = ((delta.hours ?? 0) * 3600 + (delta.minutes ?? 0) * 60 + (delta.seconds ?? 0)) * 1000;
  return d.getTime() + ms;
}

export function freeze(state: TimewarpState, realNow: number): TimewarpState {
  return state.frozenAt === null ? { ...state, frozenAt: virtualNow(state, realNow) } : state;
}

export function unfreeze(state: TimewarpState, realNow: number): TimewarpState {
  return state.frozenAt === null
    ? state
    : { ...state, frozenAt: null, offsetMs: state.frozenAt - realNow };
}
