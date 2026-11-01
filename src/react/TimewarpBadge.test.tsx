// @vitest-environment happy-dom
/// <reference lib="dom" />
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../core/clock';
import { timewarp } from '../timewarp';
import { badgeLabel } from './shared';
import { TimewarpBadge } from './TimewarpBadge';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  act(() => timewarp.reset());
  timewarp.uninstall();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('<TimewarpBadge> (web)', () => {
  it('shows only while warped', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    timewarp.install({ enabled: true });
    const el = document.createElement('div');
    document.body.append(el);
    act(() => createRoot(el).render(<TimewarpBadge />));
    expect(el.textContent).toBe('');
    act(() => timewarp.set({ now: Date.UTC(2026, 11, 31, 22, 58), locale: 'de-DE' }));
    act(() => timewarp.freeze());
    expect(el.textContent).toMatch(/^⏱ Time warped: 3[01] Dec, \d\d:58 · frozen · de-DE$/);
  });
});

describe('right-to-left on the web', () => {
  it('sets dir="rtl" on <html> while on and restores the original value', () => {
    document.documentElement.dir = 'ltr';
    const el = document.createElement('div');
    document.body.append(el);
    act(() => createRoot(el).render(<TimewarpBadge />));
    act(() => timewarp.set({ rtl: true, pseudo: true }));
    expect(document.documentElement.dir).toBe('rtl');
    expect(el.textContent).toContain('pseudo · RTL');
    act(() => timewarp.set({ rtl: false }));
    expect(document.documentElement.dir).toBe('ltr');
  });
});

describe('badgeLabel', () => {
  it('formats in the warped zone and lists overrides', () => {
    const state = { ...initialState, timeZone: 'UTC', locale: 'ja-JP' };
    expect(badgeLabel(state, Date.UTC(2026, 11, 31, 23, 58))).toBe(
      'Time warped: 31 Dec, 23:58 · ja-JP · UTC',
    );
  });
});
