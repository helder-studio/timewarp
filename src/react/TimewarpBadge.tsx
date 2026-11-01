import { useEffect } from 'react';
import { isWarped } from '../core/clock';
import { badgeLabel, useTimewarpState, useVirtualNow } from './shared';

declare const document: { documentElement: { dir: string } } | undefined;

let originalDir: string | undefined;

/** Sets `dir="rtl"` on <html> while RTL is on, and restores the page's own value after. */
function useWebRtl(rtl: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (rtl) {
      originalDir ??= root.dir;
      root.dir = 'rtl';
    } else if (originalDir !== undefined) {
      root.dir = originalDir;
      originalDir = undefined;
    }
  }, [rtl]);
}

/**
 * Web: a fixed badge whenever the clock, locale or zone is warped, so screenshots and bug reports
 * show it. Renders nothing at real time. Drive the warp with `timewarp.*`; a web panel comes later.
 */
export function TimewarpBadge() {
  const state = useTimewarpState();
  useWebRtl(state.rtl);
  const now = useVirtualNow();
  if (!isWarped(state)) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 2147483647,
        padding: '4px 10px',
        borderRadius: 999,
        font: '600 12px system-ui, sans-serif',
        color: '#fff',
        background: '#7b1fa2',
        pointerEvents: 'none',
      }}
    >
      {`⏱ ${badgeLabel(state, now)}`}
    </div>
  );
}
