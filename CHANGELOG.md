# @helder-studio/timewarp

## 0.2.0

### Minor Changes

- acc0742: Add pseudo-localization (pseudo, pseudoMessages, i18next pseudoPostProcessor) and a right-to-left switch, both in the panel.
- 0c0a28e: Add timewarpAgentTools (React Native): tool definitions so AI coding agents can set, move and reset the app clock and locale through Rozenite for Agents.

## 0.1.0

### Minor Changes

- 15ce6a8: First release: clock offset, travel, freeze, presets, locale override, experimental Intl time zone, saved warp, badge and React Native panel.
- 3bd724e: experimental_timeZone now also moves local Date getters (getHours, getDate, getTimezoneOffset and friends) into the chosen zone.
- 3513640: Add timewarpTab for dev-dock.

### Patch Changes

- 84c56f7: Fix: the patched Date reports name 'Date' and length 7 like the original.
