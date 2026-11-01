import { afterEach, describe, expect, it } from 'vitest';
import { pseudo, pseudoMessages, pseudoPostProcessor } from './i18n';
import { timewarp } from './timewarp';

afterEach(() => timewarp.reset());

describe('pseudo adapters', () => {
  it('change nothing while the switch is off', () => {
    const messages = { save: 'Save' };
    expect(pseudo('Save')).toBe('Save');
    expect(pseudoMessages(messages)).toBe(messages);
    expect(pseudoPostProcessor.process('Save')).toBe('Save');
  });

  it('pseudo-localize while it is on', () => {
    timewarp.set({ pseudo: true });
    expect(pseudo('Save')).toBe('[Šáṽé one]');
    expect(pseudoMessages({ save: 'Save', hi: 'Hi {name}' })).toEqual({
      save: '[Šáṽé one]',
      hi: '[Ĥî {name} one]',
    });
    expect(pseudoPostProcessor).toMatchObject({ type: 'postProcessor', name: 'pseudo' });
    expect(pseudoPostProcessor.process('Save')).toBe('[Šáṽé one]');
    expect(timewarp.isWarped()).toBe(true);
  });

  it('counts RTL as a warp', () => {
    timewarp.set({ rtl: true });
    expect(timewarp.getState().rtl).toBe(true);
    expect(timewarp.isWarped()).toBe(true);
  });
});
