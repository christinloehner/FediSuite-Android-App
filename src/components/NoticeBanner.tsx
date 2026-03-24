import { StyleSheet, Text, useColorScheme } from 'react-native';

import { palette } from '../theme/colors';
import { Card } from './Card';

export function NoticeBanner({ markdown }: { markdown: string }) {
  const isDark = useColorScheme() !== 'light';

  return (
    <Card>
      <Text style={[styles.title, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>Hinweis</Text>
      <Text style={[styles.body, { color: isDark ? palette.text : palette.lightText }]}>{markdown}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
