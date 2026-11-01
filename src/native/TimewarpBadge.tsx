import { type ReactNode, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { isWarped, type TravelDelta } from '../core/clock';
import type { PresetName } from '../core/presets';
import { RealDate } from '../patch';
import { badgeLabel, useTimewarpState, useVirtualNow } from '../react/shared';
import { timewarp } from '../timewarp';

/**
 * React Native: a badge while the clock, locale or zone is warped (or always, with `alwaysShow`).
 * Tap it to open the panel. Render it once near the root, after `timewarp.install()`.
 */
export function TimewarpBadge({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const state = useTimewarpState();
  const now = useVirtualNow();
  const [open, setOpen] = useState(false);
  const warped = isWarped(state);
  if (!warped && !alwaysShow) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${warped ? badgeLabel(state, now) : 'Real time'}. Open time panel`}
        onPress={() => setOpen(true)}
        style={styles.badge}
      >
        <Text style={styles.badgeText}>⏱ {warped ? badgeLabel(state, now) : 'Real time'}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Timewarp</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={styles.link}>Close</Text>
            </Pressable>
          </View>
          <TimewarpPanel />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const PRESETS: [PresetName, string][] = [
  ['tomorrow', 'Tomorrow'],
  ['next-week', 'Next week'],
  ['end-of-day', 'End of day'],
  ['end-of-month', 'End of month'],
  ['end-of-year', 'New Year’s Eve'],
  ['next-dst', 'Before next DST change'],
];

const STEPS: [string, TravelDelta, TravelDelta][] = [
  ['Month', { months: -1 }, { months: 1 }],
  ['Week', { weeks: -1 }, { weeks: 1 }],
  ['Day', { days: -1 }, { days: 1 }],
  ['Hour', { hours: -1 }, { hours: 1 }],
  ['15 min', { minutes: -15 }, { minutes: 15 }],
];

const LOCALES = [null, 'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP', 'ar-EG'];
const ZONES = [null, 'UTC', 'Europe/Amsterdam', 'America/New_York', 'Asia/Tokyo'];

/** The panel content, also usable as a dev-dock tab. */
export function TimewarpPanel() {
  const state = useTimewarpState();
  const now = useVirtualNow();
  const full = new Intl.DateTimeFormat(state.locale ?? undefined, {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new RealDate(now));
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.now} accessibilityRole="header">
        {full}
      </Text>

      <View style={styles.row}>
        <Text>Freeze clock</Text>
        <Switch
          value={state.frozenAt !== null}
          onValueChange={(on) => (on ? timewarp.freeze() : timewarp.unfreeze())}
        />
      </View>

      <Text style={styles.section}>Jump to</Text>
      <Chips>
        {PRESETS.map(([name, label]) => (
          <Chip key={name} label={label} onPress={() => timewarp.preset(name)} />
        ))}
      </Chips>

      <Text style={styles.section}>Step</Text>
      {STEPS.map(([label, back, forward]) => (
        <View key={label} style={styles.row}>
          <Chip
            label="−"
            accessibilityLabel={`${label} back`}
            onPress={() => timewarp.travel(back)}
          />
          <Text>{label}</Text>
          <Chip
            label="+"
            accessibilityLabel={`${label} forward`}
            onPress={() => timewarp.travel(forward)}
          />
        </View>
      ))}

      <Text style={styles.section}>Locale</Text>
      <Chips>
        {LOCALES.map((locale) => (
          <Chip
            key={locale ?? 'device'}
            label={locale ?? 'Device'}
            selected={state.locale === locale}
            onPress={() => timewarp.set({ locale })}
          />
        ))}
      </Chips>

      <Text style={styles.section}>Time zone (experimental, formatting only)</Text>
      <Chips>
        {ZONES.map((zone) => (
          <Chip
            key={zone ?? 'device'}
            label={zone ?? 'Device'}
            selected={state.timeZone === zone}
            onPress={() => timewarp.set({ experimental_timeZone: zone })}
          />
        ))}
      </Chips>

      <Pressable accessibilityRole="button" onPress={timewarp.reset} style={styles.reset}>
        <Text style={styles.resetText}>Reset to real time</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

function Chip({
  label,
  onPress,
  selected = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={selected ? styles.chipTextOn : undefined}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 12,
    bottom: 48,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#7b1fa2',
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  panel: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 8 },
  now: { fontSize: 16, fontWeight: '600' },
  section: { fontWeight: '600', marginTop: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dadce0',
    minHeight: 40,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: '#7b1fa2', borderColor: '#7b1fa2' },
  chipTextOn: { color: '#fff' },
  link: { color: '#1a73e8', fontWeight: '600' },
  reset: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
  },
  resetText: { fontWeight: '600' },
});

/**
 * Tab for `@helder-studio/dev-dock`: `<DevDock tabs={[timewarpTab]} />`. Skip `<TimewarpBadge />`
 * when using it; the dock button shows the warp instead.
 */
export const timewarpTab = {
  id: 'timewarp',
  title: 'Time',
  status: () =>
    isWarped(timewarp.getState()) ? badgeLabel(timewarp.getState(), timewarp.now()) : null,
  subscribe: timewarp.subscribe,
  render: () => <TimewarpPanel />,
};
