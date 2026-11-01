import { type PseudoOptions, pseudoLocalize } from './core/pseudo';
import { timewarp } from './timewarp';

/** Pseudo-localizes `text` while the pseudo switch is on; returns it unchanged otherwise. */
export function pseudo(text: string, options?: PseudoOptions): string {
  return timewarp.getState().pseudo ? pseudoLocalize(text, options) : text;
}

/**
 * i18next post-processor. Register it and turn it on in your config:
 * `i18next.use(pseudoPostProcessor).init({ postProcess: ['pseudo'], … })`.
 * It only changes strings while the pseudo switch is on.
 */
export const pseudoPostProcessor = {
  type: 'postProcessor' as const,
  name: 'pseudo',
  process: (value: string) => pseudo(value),
};

/**
 * For react-intl / FormatJS and other message-map libraries:
 * `<IntlProvider messages={pseudoMessages(messages)} …>`. Re-render on changes with
 * `useTimewarpState()` so toggling applies without a reload.
 */
export function pseudoMessages<T extends Record<string, string>>(
  messages: T,
  options?: PseudoOptions,
): T {
  if (!timewarp.getState().pseudo) return messages;
  return Object.fromEntries(
    Object.entries(messages).map(([k, v]) => [k, pseudoLocalize(v, options)]),
  ) as T;
}
