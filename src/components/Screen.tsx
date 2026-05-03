import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { spacing } from '../theme';

type ScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
}>;

export function Screen({ children, scrollable, footer, refreshControl }: ScreenProps) {
  const isDark = useIsDark();

  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? palette.ink : palette.canvas }]}>
      {content}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
