import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette } from '../theme/colors';
import { spacing } from '../theme';

export function LoadingView({ label }: { label: string }) {
  const isDark = useColorScheme() !== 'light';

  return (
    <View style={styles.container}>
      <ActivityIndicator color={isDark ? palette.accent : palette.accentStrong} size="large" />
      <Text style={[styles.label, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    fontSize: 14,
  },
});
