import { StyleSheet, Text, View } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { spacing } from '../theme';

type Slot = {
  day: number;
  hour: number;
  value: number;
};

const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function HeatmapGrid({
  data,
  emptyLabel,
}: {
  data: Slot[];
  emptyLabel: string;
}) {
  const isDark = useIsDark();
  const normalizedData = data.map((item) => ({
    ...item,
    value: toNumber(item.value),
  }));
  const maxValue = Math.max(1, ...normalizedData.map((item) => item.value));

  if (normalizedData.length === 0) {
    return <Text style={[styles.empty, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{emptyLabel}</Text>;
  }

  const cells = new Map<string, number>();
  normalizedData.forEach((item) => {
    cells.set(`${item.day}-${item.hour}`, item.value);
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.daySpacer} />
        {[0, 6, 12, 18, 23].map((hour) => (
          <Text key={hour} style={[styles.axisLabel, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            {hour}
          </Text>
        ))}
      </View>
      {dayLabels.map((label, day) => (
        <View key={label} style={styles.gridRow}>
          <Text style={[styles.dayLabel, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{label}</Text>
          <View style={styles.cells}>
            {Array.from({ length: 24 }, (_, hour) => {
              const value = cells.get(`${day}-${hour}`) ?? 0;
              return (
                <View
                  key={`${day}-${hour}`}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: getHeatmapColor(value, maxValue, isDark),
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function getHeatmapColor(value: number, maxValue: number, isDark: boolean) {
  if (value <= 0) {
    return isDark ? palette.panelMuted : palette.surfaceMuted;
  }

  const intensity = value / maxValue;

  if (intensity > 0.8) return '#F16B6B';
  if (intensity > 0.6) return '#F1B24A';
  if (intensity > 0.4) return '#6DD3CE';
  if (intensity > 0.2) return '#7BC3FF';
  return '#365780';
}

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 26,
  },
  daySpacer: {
    width: 0,
  },
  axisLabel: {
    fontSize: 10,
    width: 22,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    width: 18,
    fontSize: 10,
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 2,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
});
