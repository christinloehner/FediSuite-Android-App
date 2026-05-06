import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { loginWithPassword } from '../../api/auth';
import { Button } from '../../components/Button';
import { useIsDark } from '../../hooks/useIsDark';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useI18n } from '../../i18n';
import type { AuthStackParamList } from '../../navigation/types';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage } from '../../utils/error';
import { saveTokenForInstance } from '../../utils/storage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const isDark = useIsDark();
  const { t } = useI18n('auth');
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const clearActiveInstance = useInstanceStore((state) => state.clearActiveInstance);
  const setSession = useSessionStore((state) => state.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!instanceUrl) {
        throw new Error('Keine aktive Instanz gesetzt.');
      }

      return loginWithPassword(instanceUrl, identifier.trim(), password);
    },
    onSuccess: async (data) => {
      if (!instanceUrl) {
        return;
      }

      await saveTokenForInstance(instanceUrl, data.token);
      setSession({
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          isAdmin: data.isAdmin,
        },
      });
      setPassword('');
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
    },
    onError: (mutationError) => {
      setError(getErrorMessage(mutationError, t('loginError')));
    },
  });

  const handleBack = async () => {
    clearActiveInstance();
    useSessionStore.getState().clearSession();
    await queryClient.clear();
    navigation.replace('Instance');
  };

  return (
    <Screen
      scrollable
      footer={<Button label={t('loginButton')} onPress={() => loginMutation.mutate()} loading={loginMutation.isPending} />}
    >
      <View style={styles.hero}>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('subtitle', { instance: instanceUrl ?? '' })}
        </Text>
      </View>

      <Card>
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label={t('loginLabel')}
          placeholder="user@example.org"
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value);
            setError(null);
          }}
          error={error}
        />
        <TextField
          secureTextEntry
          label={t('passwordLabel')}
          placeholder="••••••••"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(null);
          }}
        />
      </Card>

      <Button label={t('switchInstance')} onPress={handleBack} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
