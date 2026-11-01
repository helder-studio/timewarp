# @helder-studio/timewarp

Overrides the app's clock (offset, freeze) and locale, plus an experimental Intl time zone, for QA on
real devices. React Native + web. PDF: "Library 3: Timewarp".

## Layout

- `src/core/clock.ts`: pure state math (`virtualNow`, `setTime`, calendar-aware `addDelta`, freeze).
- `src/core/presets.ts`: preset targets in the device zone; `nextOffsetChange` scans 6 h steps then
  bisects to the minute.
- `src/patch.ts`: replaces `Date` with a function (so `Date()` still returns a string) sharing
  `RealDate.prototype`; wraps Intl constructors and `Date/Number#toLocale*`, `String#localeCompare`.
  Patched code reads state on every call. Idempotent via `Symbol.for('helder-studio.timewarp')`.
- `src/timewarp.ts`: singleton API, persistence under `helder-studio:timewarp`, no patching on the
  server (no `document` and not React Native).
- `src/react/`: hooks + web badge. `src/native/`: badge + Modal panel, `TimewarpPanel` for dev-dock.
- Entries: `index` (web), `native` (`react-native` condition), `noop`.

## Notes

- Tests set `process.env.TZ` at runtime (Node honours it) for the Amsterdam / New York DST cases.
- Timezone stays experimental: Date getters can't follow it without patching every getter (spike open).
- Hermes `Intl` timeZone support on Android is unverified: device check needed.

## Commands

`pnpm verify`, `pnpm coverage`, `pnpm changeset`.
