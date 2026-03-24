import { Pressable, StyleSheet, Text, useColorScheme } from 'react-native';

import { palette } from '../theme/colors';
import { radius, spacing } from '../theme';

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const isDark = useColorScheme() !== 'light';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? isDark
              ? palette.accent
              : palette.accentStrong
            : isDark
              ? palette.panelMuted
              : palette.surfaceMuted,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? palette.ink : isDark ? palette.text : palette.lightText,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    borderRadius: radius.pill,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
