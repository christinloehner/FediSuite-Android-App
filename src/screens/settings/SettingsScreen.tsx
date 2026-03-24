import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { updatePreferences } from '../../api/mobile';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { appVersion } from '../../utils/appInfo';
import { getErrorMessage, isAuthError } from '../../utils/error';
import { deleteTokenForInstance } from '../../utils/storage';

export function SettingsScreen() {
  const isDark = useColorScheme() !== 'light';
  const queryClient = useQueryClient();
  const bootstrapQuery = useBootstrap();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const clearActiveInstance = useInstanceStore((state) => state.clearActiveInstance);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setLanguage = useSessionStore((state) => state.setLanguage);
  const recoverFromAuthFailure = useAuthRecovery();
  const [formError, setFormError] = useState<string | null>(null);

  const profile = bootstrapQuery.data?.user;
  const accounts = bootstrapQuery.data?.accounts ?? [];
  const [nextLanguage, setNextLanguage] = useState(profile?.language ?? 'de');
  const [nextTheme, setNextTheme] = useState(profile?.theme ?? 'dark');
  const [nextTimezone, setNextTimezone] = useState(profile?.timezone ?? 'Europe/Berlin');
  const [nextDefaultAccountId, setNextDefaultAccountId] = useState<number | null>(profile?.default_account_id ?? null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setNextLanguage(profile.language);
    setNextTheme(profile.theme);
    setNextTimezone(profile.timezone);
    setNextDefaultAccountId(profile.default_account_id ?? null);
  }, [profile]);

  const preferenceMutation = useMutation({
    mutationFn: async () => {
      if (!instanceUrl || !token || !bootstrapQuery.data) {
        throw new Error('Präferenzen können gerade nicht aktualisiert werden.');
      }

      return updatePreferences(instanceUrl, token, language, {
        language: nextLanguage,
        theme: nextTheme,
        timezone: nextTimezone,
        defaultAccountId: nextDefaultAccountId ?? undefined,
      });
    },
    onSuccess: async (response) => {
      setLanguage(response.profile.language);
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
      setFormError(null);
      Alert.alert('Präferenzen aktualisiert', 'Die mobilen Einstellungen wurden gespeichert.');
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Präferenzen konnten nicht gespeichert werden.'));
      if (isAuthError(error)) {
        void recoverFromAuthFailure();
      }
    },
  });

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

  const handleApplyPreferences = () => {
    setFormError(null);
    preferenceMutation.mutate();
  };

  return (
    <Screen scrollable>
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Instanz, Session und mobile Präferenzen
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Aktive Instanz</Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>{instanceUrl}</Text>
        <Button label="Instanz wechseln" onPress={handleSwitchInstance} variant="secondary" />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Profil</Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {profile?.email ?? 'Profil wird geladen...'}
        </Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Aktuell: Sprache {profile?.language ?? 'de'} | Theme {profile?.theme ?? 'dark'} | TZ {profile?.timezone ?? 'Europe/Berlin'}
        </Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Sprache</Text>
        <View style={styles.filterWrap}>
          {['de', 'en'].map((value) => (
            <Chip key={value} label={value.toUpperCase()} active={nextLanguage === value} onPress={() => setNextLanguage(value)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Theme</Text>
        <View style={styles.filterWrap}>
          {['dark', 'light'].map((value) => (
            <Chip key={value} label={value} active={nextTheme === value} onPress={() => setNextTheme(value)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Zeitzone</Text>
        <TextField
          label="Timezone"
          value={nextTimezone}
          onChangeText={setNextTimezone}
          placeholder="Europe/Berlin"
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Default Account</Text>
        {accounts.length === 0 ? (
          <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            Keine Accounts vorhanden.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterWrapHorizontal}>
              {accounts.map((account) => (
                <Chip
                  key={account.id}
                  label={account.display_name || `@${account.username}`}
                  active={nextDefaultAccountId === account.id}
                  onPress={() => setNextDefaultAccountId(account.id)}
                />
              ))}
            </View>
          </ScrollView>
        )}
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <Button
          label="Präferenzen speichern"
          onPress={handleApplyPreferences}
          loading={preferenceMutation.isPending}
          variant="secondary"
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Sicherheit</Text>
        <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          JWTs werden nur im SecureStore gespeichert und sind an die aktive Instanz gebunden.
        </Text>
        <Button label="Logout" onPress={handleLogout} variant="danger" />
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          © FediSuite · Version {appVersion}
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
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterWrapHorizontal: {
    flexDirection: 'row',
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '700',
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
