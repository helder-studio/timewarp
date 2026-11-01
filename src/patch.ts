import type { TimewarpState } from './core/clock';

/** The untouched constructor, captured when this module loads. */
export const RealDate: DateConstructor = Date;

type Saved = {
  Date: DateConstructor;
  intl: Record<string, unknown>;
  methods: [object, string, unknown][];
};

const INSTALLED = Symbol.for('helder-studio.timewarp');
const registry = globalThis as unknown as Record<symbol, Saved | undefined>;

const INTL_CONSTRUCTORS = [
  'DateTimeFormat',
  'NumberFormat',
  'Collator',
  'PluralRules',
  'RelativeTimeFormat',
  'ListFormat',
  'DisplayNames',
  'Segmenter',
];

// Intl's properties are not enumerable, so copy them by name.
const RealIntl: Record<string, unknown> = Object.fromEntries(
  INTL_CONSTRUCTORS.map((name) => [name, (Intl as unknown as Record<string, unknown>)[name]]),
);

type Options = Record<string, unknown> | undefined;

/**
 * Replaces `Date` and wraps Intl constructors and `toLocale*` methods. Every patched function reads
 * `getState()` / `now()` on each call, so later changes apply without reinstalling. Idempotent.
 */
export function patch(now: () => number, getState: () => TimewarpState): void {
  if (registry[INSTALLED]) return;
  const saved: Saved = { Date: globalThis.Date, intl: {}, methods: [] };

  const locale = (given: unknown) => given ?? getState().locale ?? undefined;
  const withZone = (options: Options): Options => {
    const timeZone = getState().timeZone;
    return timeZone && options?.timeZone === undefined ? { ...options, timeZone } : options;
  };

  // A function, not a class: `Date()` without `new` must keep returning a string.
  const WarpedDate = function (this: unknown, ...args: unknown[]) {
    if (!new.target) return new RealDate(now()).toString();
    return Reflect.construct(RealDate, args.length ? args : [now()], new.target);
  } as unknown as DateConstructor & { prototype: Date };
  Object.setPrototypeOf(WarpedDate, RealDate); // Date.UTC, Date.parse
  // Same prototype: `instanceof Date` holds for dates made before and after the patch.
  (WarpedDate as { prototype: Date }).prototype = RealDate.prototype;
  WarpedDate.now = now;
  globalThis.Date = WarpedDate;

  const intl = Intl as unknown as Record<string, unknown>;
  for (const name of INTL_CONSTRUCTORS) {
    const Real = RealIntl[name] as (new (...a: unknown[]) => object) | undefined;
    if (typeof Real !== 'function') continue;
    saved.intl[name] = intl[name];
    const isDateFormat = name === 'DateTimeFormat';
    const Wrapped = function (this: unknown, locales?: unknown, options?: Options) {
      const args = [locale(locales), isDateFormat ? withZone(options) : options];
      return new.target
        ? Reflect.construct(Real, args, new.target)
        : (Real as unknown as (...a: unknown[]) => object)(...args);
    };
    Object.setPrototypeOf(Wrapped, Real); // supportedLocalesOf
    Wrapped.prototype = Real.prototype;
    intl[name] = Wrapped;
  }

  const wrapMethod = (target: object, name: string, map: (args: unknown[]) => unknown[]) => {
    const original = (target as Record<string, unknown>)[name] as (...a: unknown[]) => unknown;
    saved.methods.push([target, name, original]);
    (target as Record<string, unknown>)[name] = function (this: unknown, ...args: unknown[]) {
      return original.apply(this, map(args));
    };
  };
  for (const name of ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString']) {
    wrapMethod(RealDate.prototype, name, ([locales, options]) => [
      locale(locales),
      withZone(options as Options),
    ]);
  }
  wrapMethod(Number.prototype, 'toLocaleString', ([locales, options]) => [
    locale(locales),
    options,
  ]);
  wrapMethod(String.prototype, 'localeCompare', ([that, locales, options]) => [
    that,
    locale(locales),
    options,
  ]);

  registry[INSTALLED] = saved;
}

export function unpatch(): void {
  const saved = registry[INSTALLED];
  if (!saved) return;
  globalThis.Date = saved.Date;
  Object.assign(Intl, saved.intl);
  for (const [target, name, original] of saved.methods) {
    (target as Record<string, unknown>)[name] = original;
  }
  registry[INSTALLED] = undefined;
}

export function isPatched(): boolean {
  return registry[INSTALLED] !== undefined;
}

/** Throws a RangeError for a time zone this runtime's Intl doesn't know. */
export function assertTimeZone(timeZone: string): void {
  new (RealIntl.DateTimeFormat as typeof Intl.DateTimeFormat)('en', { timeZone });
}
