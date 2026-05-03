import { StyleSheet, Text, View } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { radius, spacing } from '../theme';

export function MetricCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'danger' | 'accent' }) {
  const isDark = useIsDark();
  const backgroundColor =
    tone === 'danger'
      ? 'rgba(241, 107, 107, 0.18)'
      : tone === 'accent'
        ? 'rgba(109, 211, 206, 0.18)'
        : isDark
          ? palette.panelMuted
          : palette.surfaceMuted;

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={[styles.value, { color: isDark ? palette.text : palette.lightText }]}>{value}</Text>
      <Text style={[styles.label, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
});
