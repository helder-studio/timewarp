# @helder-studio/timewarp

nShared rules, commands and conventions: @AGENTS.md

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
- `src/core/pseudo.ts`: pseudo-localizer (balanced braces protected for ICU). `src/i18n.ts`: adapters
  (`pseudo`, `pseudoMessages`, i18next `pseudoPostProcessor`) that act only while `state.pseudo`.
- RTL: web badge sets `<html dir>` and restores it; native `useNativeRtl` calls `I18nManager.forceRTL`
  (applies after reload; the panel offers `DevSettings.reload()`).
- `src/react/`: hooks + web badge. `src/native/`: badge + Modal panel, `TimewarpPanel` for dev-dock.
- Entries: `index` (web), `native` (`react-native` condition), `noop`.

## Notes

- Tests set `process.env.TZ` at runtime (Node honours it) for the Amsterdam / New York DST cases.
- Timezone spike (2026-11-01): local getters (`getFullYear`…`getSeconds`, `getDay`, `getTimezoneOffset`)
  read the zone via a cached `formatToParts`; DST tests for Amsterdam / New York / Tokyo pass. Local
  constructors, setters and `toString()` stay in the device zone, so it ships as `experimental_timeZone`.
  Timewarp's own calendar math runs inside `inDeviceZone()`.
- Hermes `Intl` timeZone support on Android is unverified: device check needed.

## Commands

`pnpm verify`, `pnpm coverage`, `pnpm changeset`.
