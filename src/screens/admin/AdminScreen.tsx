import { Text, View, StyleSheet, useColorScheme } from 'react-native';

import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { useBootstrap } from '../../hooks/useBootstrap';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';

export function AdminScreen() {
  const isDark = useColorScheme() !== 'light';
  const bootstrapQuery = useBootstrap();

  if (!bootstrapQuery.data?.user.is_admin) {
    return (
      <Screen>
        <EmptyState
          title="Kein Admin-Zugriff"
          description="Diese Fläche ist nur für Admin-Benutzer sichtbar."
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Admin</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Leichte mobile Admin-Fläche
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Global Notice</Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Aktiv: {bootstrapQuery.data.notice.enabled ? 'ja' : 'nein'}
        </Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {bootstrapQuery.data.notice.markdown || 'Kein Notice-Text vorhanden.'}
        </Text>
      </Card>

      <EmptyState
        title="Nächster Admin-Schritt"
        description="Gemäß Spezifikation bleibt die mobile Admin-Fläche zunächst bewusst klein. Eine Bearbeitung des globalen Notice-Texts kann hier später ergänzt werden."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
