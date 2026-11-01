const ACCENTED: Record<string, string> = {
  a: 'á',
  b: 'ƀ',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ĝ',
  h: 'ĥ',
  i: 'î',
  j: 'ĵ',
  k: 'ķ',
  l: 'ļ',
  m: 'ɱ',
  n: 'ñ',
  o: 'ö',
  p: 'þ',
  q: 'ǫ',
  r: 'ŕ',
  s: 'š',
  t: 'ţ',
  u: 'û',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ý',
  z: 'ž',
  A: 'Á',
  B: 'Ɓ',
  C: 'Ç',
  D: 'Ð',
  E: 'É',
  F: 'Ƒ',
  G: 'Ĝ',
  H: 'Ĥ',
  I: 'Î',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ļ',
  M: 'Ṁ',
  N: 'Ñ',
  O: 'Ö',
  P: 'Þ',
  Q: 'Ǫ',
  R: 'Ŕ',
  S: 'Š',
  T: 'Ţ',
  U: 'Û',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẋ',
  Y: 'Ý',
  Z: 'Ž',
};

/** printf tokens, tags and entities. Braces are handled separately (they can nest, as in ICU). */
const PROTECTED = /%(\d+\$)?[sdif@]|<[^>]+>|&[a-z]+;/g;

/** Splits text into plain runs and protected runs (balanced `{…}` blocks and PROTECTED tokens). */
function segments(text: string): { text: string; protect: boolean }[] {
  const out: { text: string; protect: boolean }[] = [];
  let plain = '';
  const flush = () => {
    if (!plain) return;
    let last = 0;
    for (const m of plain.matchAll(PROTECTED)) {
      if ((m.index ?? 0) > last) out.push({ text: plain.slice(last, m.index), protect: false });
      out.push({ text: m[0], protect: true });
      last = (m.index ?? 0) + m[0].length;
    }
    if (last < plain.length) out.push({ text: plain.slice(last), protect: false });
    plain = '';
  };
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') {
      plain += text[i];
      continue;
    }
    let depth = 0;
    let end = i;
    for (; end < text.length; end++) {
      if (text[end] === '{') depth++;
      else if (text[end] === '}' && --depth === 0) break;
    }
    flush();
    out.push({ text: text.slice(i, end + 1), protect: true });
    i = end;
  }
  flush();
  return out;
}

const FILLER = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export interface PseudoOptions {
  /** How much longer than the source, as a fraction. Default 0.35 (typical for German). */
  expand?: number;
  /** Wrap in `[ ]` so clipped text is easy to spot. Default true. */
  brackets?: boolean;
}

/**
 * `"Save {count} items"` → `"[Šávé {count} îţéɱš one two]"`: still readable, accented to catch
 * fonts and hard-coded strings, longer to catch truncation, with placeholders left intact.
 */
export function pseudoLocalize(
  text: string,
  { expand = 0.35, brackets = true }: PseudoOptions = {},
): string {
  if (!text) return text;
  let out = '';
  let visible = 0;
  for (const part of segments(text)) {
    if (part.protect) {
      out += part.text;
      continue;
    }
    out += [...part.text].map((ch) => ACCENTED[ch] ?? ch).join('');
    visible += part.text.length;
  }
  const target = Math.ceil(visible * expand);
  let padding = '';
  for (let i = 0; padding.length < target; i++) padding += ` ${FILLER[i % FILLER.length]}`;
  return brackets ? `[${out}${padding}]` : out + padding;
}
