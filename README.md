<div align="center">

# @helder-studio/timewarp

**Test tomorrow, today. Change the app's clock and locale on a real device.**

Travel to next week, freeze time, switch to German: without touching device settings or reinstalling
the build. React Native and web.

[![npm](https://img.shields.io/npm/v/@helder-studio/timewarp?color=cb3837&logo=npm)](https://www.npmjs.com/package/@helder-studio/timewarp)
[![bundle size](https://img.shields.io/bundlejs/size/@helder-studio/timewarp?label=min%2Bgzip)](https://bundlejs.com/?q=@helder-studio/timewarp)
[![CI](https://github.com/helder-studio/timewarp/actions/workflows/ci.yml/badge.svg)](https://github.com/helder-studio/timewarp/actions/workflows/ci.yml)
[![provenance](https://img.shields.io/badge/npm-provenance-2ea44f?logo=sigstore)](https://www.npmjs.com/package/@helder-studio/timewarp#provenance)
[![license](https://img.shields.io/npm/l/@helder-studio/timewarp?color=blue)](./LICENSE)

<!-- demo GIF -->

</div>

```sh
npm install @helder-studio/timewarp
```

## Why

"Does tomorrow's delivery slot show up after 22:00?" "What does the order screen look like in
German?" Answering that on a phone usually means changing the system clock (which breaks sign-in and
TLS) or the device language (which restarts the app). Timewarp changes time and locale inside your app
only, and a badge makes sure nobody files a bug about the wrong date.

## Quick start

```tsx
// index.js: first lines, before anything reads Date
import { timewarp, TimewarpBadge } from '@helder-studio/timewarp';
import { mmkv } from '@helder-studio/storage';

timewarp.install({ enabled: __DEV__ || Config.QA_BUILD, storage: mmkv(storage) });

// Root component
<>
  <App />
  <TimewarpBadge />
</>;
```

```ts
timewarp.set({ now: '2026-12-31T23:58:00', locale: 'de-DE' });
timewarp.travel({ days: 1 }); // jump forward
timewarp.freeze(); // stop the clock
timewarp.reset();
```

## Features

- ⏩ **Time travel**: set an exact moment or jump by months, weeks, days, hours or minutes
- 🧊 **Freeze**: stop the clock to test countdowns, expiry and "just now" labels
- 🌍 **Locale override**: Intl formatting and `toLocale*String` follow your chosen locale
- 📍 **Presets**: tomorrow, next week, end of day, end of month, New Year's Eve, right before the next
  DST change
- 📱 **Panel on the device**: tap the badge for presets, steppers, freeze, locale and zone, with no
  native date picker dependency
- 💾 **Survives restarts**: the warp is saved through any
  [`@helder-studio/storage`](https://github.com/helder-studio/storage) adapter
- 🏷️ **Always visible**: a badge like "Time warped: 31 Dec 23:58" whenever anything is overridden
- 🚫 **Production-safe**: `enabled: false` patches nothing, and a `/noop` entry drops the code from
  release bundles

## What gets overridden

| Override                   | How                                                                         | Reliability                                                          |
| -------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `new Date()`, `Date.now()` | `Date` is replaced; real time + offset, or a frozen instant                 | high                                                                 |
| Locale                     | Intl constructors and `toLocale*String` get your locale when none is passed | high for Intl-based code                                             |
| Time zone (experimental)   | `timeZone` is injected into Intl formatting                                 | partial: `getHours()` and `getTimezoneOffset()` keep the device zone |

`instanceof Date`, `Date.UTC`, `Date.parse`, `Date()` and JSON round trips keep working. Timers are
not touched: this is time travel, not time acceleration. i18n libraries with their own locale setting
need that setting changed too.

## Panel

`<TimewarpBadge />` on React Native opens a panel with presets, ±steps, freeze, locale and zone.
Pass `alwaysShow` to keep the badge visible at real time too. The panel content is also exported as
`<TimewarpPanel />` to embed in your own dev menu. The web build shows the badge; drive it with
`timewarp.*` for now.

## With dev-dock

Using several helder-studio tools? Put them in one floating panel with
[`@helder-studio/dev-dock`](https://github.com/helder-studio/dev-dock) and skip `<TimewarpBadge />`:

```tsx
import { timewarpTab } from '@helder-studio/timewarp';
import { DevDock } from '@helder-studio/dev-dock';

<DevDock enabled={qa} tabs={[timewarpTab]} />;
```

## Gotchas

- **Install first.** Libraries that capture `Date` at import time keep the real one, so call
  `timewarp.install()` on the first lines of your entry file.
- **The server keeps real time.** Tokens, caches and server-side dates don't move. The badge is there
  so screenshots carry that context.
- **SSR**: Timewarp never patches on the server, so client-only text based on time can differ from the
  server HTML. Fine for a dev tool, but expect a hydration warning when that text renders.
- **Async storage** (AsyncStorage) restores the warp a moment after start; MMKV and `localStorage`
  restore it before the first render.

## Keep it out of production

Alias `@helder-studio/timewarp` to `@helder-studio/timewarp/noop` in release builds (same API, does
nothing). See the [network-chaos README](https://github.com/helder-studio/network-chaos#keep-it-out-of-production)
for a Metro example.

## Compared with mockdate and fake-timers

[mockdate](https://github.com/boblauer/MockDate), [timekeeper](https://github.com/vesln/timekeeper)
and [@sinonjs/fake-timers](https://github.com/sinonjs/fake-timers) are for unit tests. Timewarp is for
the running app in a tester's hand: persistent, with a locale override, a panel and a badge.

## Support

If this saves you time, you can buy me a coffee on Ko-fi. It keeps the helder-studio libraries maintained.

<a href="https://ko-fi.com/gorian" target="_blank" rel="noopener">
  <img src="https://storage.ko-fi.com/cdn/kofi3.png?v=6" alt="Support me on Ko-fi" height="40">
</a>

## License

[MIT](./LICENSE) © helder-studio
