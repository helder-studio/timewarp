import { initialState } from './core/clock';
import type { Timewarp } from './timewarp';

export type { TimewarpState, TravelDelta } from './core/clock';
export type { PresetName } from './core/presets';
export type { InstallOptions, SetOptions, Timewarp } from './timewarp';

const noop = () => {};

/**
 * Production stand-in with the same API that patches nothing. Alias the package to
 * `@helder-studio/timewarp/noop` in release builds to keep the real code out of the bundle.
 */
export const timewarp: Timewarp = {
  install: noop,
  uninstall: noop,
  now: () => Date.now(),
  getState: () => initialState,
  isWarped: () => false,
  subscribe: () => noop,
  set: noop,
  travel: noop,
  preset: noop,
  freeze: noop,
  unfreeze: noop,
  reset: noop,
};

export function TimewarpBadge(): null {
  return null;
}

export function TimewarpPanel(): null {
  return null;
}

export const timewarpTab = {
  id: 'timewarp',
  title: 'Time',
  status: () => null,
  subscribe: () => noop,
  render: () => null,
};

export { type PseudoOptions, pseudoLocalize } from './core/pseudo';

export const pseudo = (text: string) => text;
export const pseudoMessages = <T extends Record<string, string>>(messages: T): T => messages;
export const pseudoPostProcessor = {
  type: 'postProcessor' as const,
  name: 'pseudo',
  process: (value: string) => value,
};

export type { AgentTool } from './agent';
export const timewarpAgentTools: import('./agent').AgentTool[] = [];
