import { useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { Screen } from '../../components/Screen';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useIsDark } from '../../hooks/useIsDark';
import { useI18n } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { appVersion } from '../../utils/appInfo';
import { deleteTokenForInstance } from '../../utils/storage';

export function SettingsScreen() {
  const isDark = useIsDark();
  const queryClient = useQueryClient();
  const { t } = useI18n('settings');
  const bootstrapQuery = useBootstrap();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const clearActiveInstance = useInstanceStore((state) => state.clearActiveInstance);
  const clearSession = useSessionStore((state) => state.clearSession);
  const language = useAppSettingsStore((state) => state.language);
  const theme = useAppSettingsStore((state) => state.theme);
  const setLanguage = useAppSettingsStore((state) => state.setLanguage);
  const setTheme = useAppSettingsStore((state) => state.setTheme);

  const accounts = bootstrapQuery.data?.accounts ?? [];
  const defaultAccountId = bootstrapQuery.data?.user.default_account_id ?? null;

  const handleLogout = async () => {
    if (instanceUrl) {
      await deleteTokenForInstance(instanceUrl);
    }
    clearSession();
    await queryClient.clear();
  };

  const handleSwitchInstance = async () => {
    if (instanceUrl) {
      await deleteTokenForInstance(instanceUrl);
    }
    clearSession();
    clearActiveInstance();
    await queryClient.clear();
  };

  return (
    <Screen scrollable>
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('subtitle')}
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('instanceTitle')}</Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{instanceUrl}</Text>
        <Button label={t('switchInstance')} onPress={handleSwitchInstance} variant="secondary" />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('languageTitle')}</Text>
        <View style={styles.chipRow}>
          {(['de', 'en'] as const).map((value) => (
            <Chip key={value} label={value.toUpperCase()} active={language === value} onPress={() => setLanguage(value)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('themeTitle')}</Text>
        <View style={styles.chipRow}>
          <Chip label={t('themeSystem')} active={theme === 'system'} onPress={() => setTheme('system')} />
          <Chip label={t('themeDark')} active={theme === 'dark'} onPress={() => setTheme('dark')} />
          <Chip label={t('themeLight')} active={theme === 'light'} onPress={() => setTheme('light')} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('defaultAccountTitle')}</Text>
        {accounts.length === 0 ? (
          <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            {t('noAccounts')}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {accounts.map((account) => (
                <Chip
                  key={account.id}
                  label={account.display_name || `@${account.username}`}
                  active={defaultAccountId === account.id || account.is_default}
                  onPress={() => undefined}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('securityTitle')}</Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('securityNote')}
        </Text>
        <Button label={t('logout')} onPress={handleLogout} variant="danger" />
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('version', { version: appVersion })}
        </Text>
      </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
