import { useEffect, useState, useSyncExternalStore } from 'react';
import type { TimewarpState } from '../core/clock';
import { RealDate } from '../patch';
import { timewarp } from '../timewarp';

export function useTimewarpState(): TimewarpState {
  return useSyncExternalStore(timewarp.subscribe, timewarp.getState, timewarp.getState);
}

/** Virtual time, refreshed every `intervalMs` while the clock runs. */
export function useVirtualNow(intervalMs = 1000): number {
  const state = useTimewarpState();
  const [, tick] = useState(0);
  useEffect(() => {
    if (state.frozenAt !== null) return;
    const id = setInterval(() => tick((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [state.frozenAt, intervalMs]);
  return timewarp.now();
}

// The real formatter, so the badge itself never follows the locale override.
const RealDateTimeFormat = Intl.DateTimeFormat;

/** `31 Dec 23:58`, plus the frozen marker, locale and zone when set. */
export function badgeLabel(state: TimewarpState, now: number): string {
  const time = new RealDateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...(state.timeZone && { timeZone: state.timeZone }),
  }).format(new RealDate(now));
  const parts = [`Time warped: ${time}`];
  if (state.frozenAt !== null) parts.push('frozen');
  if (state.locale) parts.push(state.locale);
  if (state.timeZone) parts.push(state.timeZone);
  return parts.join(' · ');
}
