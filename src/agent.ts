import type { PresetName } from './core/presets';
import { timewarp } from './timewarp';

/** Shape of Rozenite's `useRozeniteInAppAgentTool({ domain, tool, handler })`, without the dependency. */
export interface AgentTool {
  tool: { name: string; description: string; inputSchema: Record<string, unknown> };
  handler: (input: Record<string, unknown>) => unknown;
}

const state = () => ({ ...timewarp.getState(), now: new Date(timewarp.now()).toISOString() });

/** Lets an agent warp the app's clock and locale. */
export const timewarpAgentTools: AgentTool[] = [
  {
    tool: {
      name: 'timewarp-set',
      description:
        'Set the app clock and/or locale. now: ISO date-time (local unless it has a zone); locale: BCP 47 tag or null; pseudo / rtl: booleans.',
      inputSchema: {
        type: 'object',
        properties: {
          now: { type: 'string' },
          locale: { type: ['string', 'null'] },
          pseudo: { type: 'boolean' },
          rtl: { type: 'boolean' },
        },
      },
    },
    handler: ({ now, locale, pseudo, rtl }) => {
      timewarp.set({
        ...(typeof now === 'string' && { now }),
        ...((typeof locale === 'string' || locale === null) && { locale }),
        ...(typeof pseudo === 'boolean' && { pseudo }),
        ...(typeof rtl === 'boolean' && { rtl }),
      });
      return state();
    },
  },
  {
    tool: {
      name: 'timewarp-travel',
      description: 'Move the clock relative to now. Negative values go back.',
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(
          ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'].map((k) => [
            k,
            { type: 'number' },
          ]),
        ),
      },
    },
    handler: (delta) => {
      timewarp.travel(delta as Parameters<typeof timewarp.travel>[0]);
      return state();
    },
  },
  {
    tool: {
      name: 'timewarp-preset',
      description: 'Jump to a preset moment.',
      inputSchema: {
        type: 'object',
        properties: {
          preset: {
            type: 'string',
            enum: [
              'tomorrow',
              'next-week',
              'end-of-day',
              'end-of-month',
              'end-of-year',
              'next-dst',
            ],
          },
        },
        required: ['preset'],
      },
    },
    handler: ({ preset }) => {
      timewarp.preset(preset as PresetName);
      return state();
    },
  },
  {
    tool: {
      name: 'timewarp-reset',
      description: 'Back to real time, device locale and zone; pseudo and RTL off.',
      inputSchema: { type: 'object', properties: {} },
    },
    handler: () => {
      timewarp.reset();
      return state();
    },
  },
];
