import type { PropsWithChildren } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { palette } from '../theme/colors';
import { radius, spacing } from '../theme';

export function Card({ children }: PropsWithChildren) {
  const isDark = useColorScheme() !== 'light';

  return <View style={[styles.card, { backgroundColor: isDark ? palette.panel : palette.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
