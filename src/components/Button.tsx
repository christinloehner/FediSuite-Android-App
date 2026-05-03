import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { radius, spacing } from '../theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  leftIcon?: ReactNode;
};

export function Button({ label, onPress, disabled, loading, variant = 'primary', leftIcon }: ButtonProps) {
  const isDark = useIsDark();
  const backgroundColor =
    variant === 'primary'
      ? isDark
        ? palette.accent
        : palette.accentStrong
      : variant === 'danger'
        ? palette.danger
        : isDark
          ? palette.panelMuted
          : palette.surfaceMuted;
  const borderColor =
    variant === 'secondary'
      ? isDark
        ? palette.line
        : palette.lightLine
      : 'transparent';
  const textColor =
    variant === 'secondary'
      ? isDark
        ? palette.text
        : palette.lightText
      : variant === 'primary' && isDark
        ? palette.ink
        : palette.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
