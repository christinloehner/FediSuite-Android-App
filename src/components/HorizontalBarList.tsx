import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette } from '../theme/colors';
import { spacing } from '../theme';

type Datum = {
  label: string;
  value: number;
  meta?: string;
};

export function HorizontalBarList({
  data,
  emptyLabel,
}: {
  data: Datum[];
  emptyLabel: string;
}) {
  const isDark = useColorScheme() !== 'light';
  const normalizedData = data.map((item) => ({
    ...item,
    value: toNumber(item.value),
  }));
  const maxValue = Math.max(1, ...normalizedData.map((item) => item.value));

  if (normalizedData.length === 0) {
    return <Text style={[styles.empty, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {normalizedData.map((item) => (
        <View key={`${item.label}-${item.value}`} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={[styles.label, { color: isDark ? palette.text : palette.lightText }]}>{item.label}</Text>
            <Text style={[styles.value, { color: isDark ? palette.text : palette.lightText }]}>{formatNumber(item.value)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: isDark ? palette.panelMuted : palette.surfaceMuted }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: isDark ? palette.accentWarm : palette.accentStrong,
                  width: `${Math.max(4, (item.value / maxValue) * 100)}%`,
                },
              ]}
            />
          </View>
          {item.meta ? (
            <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{item.meta}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function formatNumber(value: unknown) {
  const numeric = toNumber(value);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 4,
  },
  meta: {
    fontSize: 11,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
});
