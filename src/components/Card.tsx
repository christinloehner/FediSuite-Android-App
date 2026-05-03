import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { radius, spacing } from '../theme';

export function Card({ children }: PropsWithChildren) {
  const isDark = useIsDark();

  return <View style={[styles.card, { backgroundColor: isDark ? palette.panel : palette.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
