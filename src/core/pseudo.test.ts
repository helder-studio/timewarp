import { describe, expect, it } from 'vitest';
import { pseudoLocalize } from './pseudo';

describe('pseudoLocalize', () => {
  it('accents letters, brackets and pads the text', () => {
    expect(pseudoLocalize('Save')).toBe('[Šáṽé one]');
    expect(pseudoLocalize('Hello world', { brackets: false, expand: 0 })).toBe('Ĥéļļö ŵöŕļð');
  });

  it('pads about 35% by default', () => {
    const source = 'Your order has been shipped';
    const out = pseudoLocalize(source, { brackets: false });
    expect(out.length).toBeGreaterThanOrEqual(Math.ceil(source.length * 1.35));
  });

  it('leaves placeholders, markup and entities intact', () => {
    const out = pseudoLocalize(
      'Hi {name}, you have {{count}} new <b>items</b> &amp; %s %1$d more',
      {
        expand: 0,
        brackets: false,
      },
    );
    expect(out).toBe('Ĥî {name}, ýöû ĥáṽé {{count}} ñéŵ <b>îţéɱš</b> &amp; %s %1$d ɱöŕé');
  });

  it('keeps ICU arguments and non-Latin text', () => {
    expect(
      pseudoLocalize('You have {n, plural, one {# item} other {# items}}', {
        expand: 0,
        brackets: false,
      }),
    ).toBe('Ýöû ĥáṽé {n, plural, one {# item} other {# items}}');
    expect(pseudoLocalize('日本 42', { expand: 0, brackets: false })).toBe('日本 42');
    expect(pseudoLocalize('')).toBe('');
  });
});
