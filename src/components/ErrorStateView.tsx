import { StyleSheet, Text } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { Button } from './Button';
import { Card } from './Card';

export function ErrorStateView({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const isDark = useIsDark();

  return (
    <Card>
      <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{title}</Text>
      <Text style={[styles.message, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{message}</Text>
      <Button label={actionLabel} onPress={onAction} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
});
