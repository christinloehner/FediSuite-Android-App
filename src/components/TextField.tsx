import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { radius, spacing } from '../theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({ label, hint, error, ...props }: Props) {
  const isDark = useIsDark();
  const borderColor = error ? palette.danger : isDark ? palette.line : palette.lightLine;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: isDark ? palette.text : palette.lightText }]}>{label}</Text>
      <TextInput
        placeholderTextColor={isDark ? palette.textMuted : palette.lightTextMuted}
        style={[
          styles.input,
          {
            color: isDark ? palette.text : palette.lightText,
            backgroundColor: isDark ? palette.panel : palette.surface,
            borderColor,
          },
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  hint: {
    color: palette.textMuted,
    fontSize: 12,
  },
  error: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
