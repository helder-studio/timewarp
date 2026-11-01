import { afterEach, describe, expect, it } from 'vitest';
import { timewarpAgentTools } from './agent';
import { timewarp } from './timewarp';

const call = (name: string, input: Record<string, unknown> = {}) =>
  timewarpAgentTools.find((t) => t.tool.name === name)?.handler(input) as {
    now: string;
    locale: string | null;
  };

afterEach(() => timewarp.reset());

describe('timewarpAgentTools', () => {
  it('set, travel, preset and reset the warp', () => {
    expect(call('timewarp-set', { now: '2030-01-01T10:00:00Z', locale: 'de-DE' })).toMatchObject({
      now: '2030-01-01T10:00:00.000Z',
      locale: 'de-DE',
    });
    expect(call('timewarp-travel', { days: 1 }).now.slice(0, 10)).toBe('2030-01-02');
    call('timewarp-preset', { preset: 'end-of-year' });
    expect(new Date(timewarp.now()).getMonth()).toBe(11);
    expect(call('timewarp-reset').locale).toBe(null);
    expect(timewarp.isWarped()).toBe(false);
  });

  it('have unique names', () => {
    const names = timewarpAgentTools.map((t) => t.tool.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
