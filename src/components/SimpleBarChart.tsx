import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette } from '../theme/colors';
import { spacing } from '../theme';

type Datum = {
  label: string;
  value: number;
  detail?: string;
};

export function SimpleBarChart({
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
    <View style={styles.chartWrap}>
      {normalizedData.map((item) => (
        <View key={`${item.label}-${item.value}`} style={styles.barItem}>
          <Text style={[styles.value, { color: isDark ? palette.text : palette.lightText }]} numberOfLines={1}>
            {formatNumber(item.value)}
          </Text>
          <View style={[styles.track, { backgroundColor: isDark ? palette.panelMuted : palette.surfaceMuted }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: isDark ? palette.accent : palette.accentStrong,
                  height: `${Math.max(6, (item.value / maxValue) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.label, { color: isDark ? palette.textMuted : palette.lightTextMuted }]} numberOfLines={2}>
            {item.label}
          </Text>
          {item.detail ? (
            <Text style={[styles.detail, { color: isDark ? palette.textMuted : palette.lightTextMuted }]} numberOfLines={1}>
              {item.detail}
            </Text>
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
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    minHeight: 170,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    height: 100,
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: 999,
    minHeight: 6,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  detail: {
    fontSize: 10,
    textAlign: 'center',
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
});
