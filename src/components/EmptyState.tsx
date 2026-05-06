import { StyleSheet, Text } from 'react-native';

import { useIsDark } from '../hooks/useIsDark';
import { palette } from '../theme/colors';
import { spacing } from '../theme';
import { Card } from './Card';

export function EmptyState({ title, description }: { title: string; description: string }) {
  const isDark = useIsDark();

  return (
    <Card>
      <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{title}</Text>
      <Text style={[styles.description, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
