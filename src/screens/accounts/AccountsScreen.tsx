import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { disconnectAccount } from '../../api/accounts';
import type { BootstrapAccount } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { LoadingView } from '../../components/LoadingView';
import { Screen } from '../../components/Screen';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useIsDark } from '../../hooks/useIsDark';
import { useI18n } from '../../i18n';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';

export function AccountsScreen() {
  const isDark = useIsDark();
  const { t } = useI18n('accounts');
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const bootstrapQuery = useBootstrap();
  const recoverFromAuthFailure = useAuthRecovery();

  useEffect(() => {
    if (bootstrapQuery.error && isAuthError(bootstrapQuery.error) && instanceUrl) {
      void recoverFromAuthFailure();
    }
  }, [bootstrapQuery.error, instanceUrl, recoverFromAuthFailure]);

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: number) => {
      if (!instanceUrl || !token) {
        throw new Error(t('noSession'));
      }

      return disconnectAccount(instanceUrl, token, language, accountId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
    },
    onError: async (error) => {
      if (isAuthError(error) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  if (bootstrapQuery.isLoading) {
    return (
      <Screen>
        <LoadingView label={t('loadingLabel')} />
      </Screen>
    );
  }

  if (bootstrapQuery.error) {
    return (
      <Screen>
        <ErrorStateView
          title={t('errorTitle')}
          message={getErrorMessage(bootstrapQuery.error)}
          actionLabel={t('retryLabel')}
          onAction={() => void bootstrapQuery.refetch()}
        />
      </Screen>
    );
  }

  const accounts = bootstrapQuery.data?.accounts ?? [];
  const defaultAccountId = bootstrapQuery.data?.user.default_account_id ?? null;

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={bootstrapQuery.isRefetching} onRefresh={() => void bootstrapQuery.refetch()} />}
    >
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('subtitle')}
        </Text>
      </View>

      {accounts.length === 0 ? (
        <EmptyState
          title={t('noAccountsTitle')}
          description={t('noAccountsDescription')}
        />
      ) : (
        accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            isDefault={defaultAccountId === account.id || account.is_default}
            busy={disconnectMutation.isPending}
            onDisconnect={() => disconnectMutation.mutate(account.id)}
          />
        ))
      )}
    </Screen>
  );
}

function AccountCard({
  account,
  isDefault,
  busy,
  onDisconnect,
}: {
  account: BootstrapAccount;
  isDefault: boolean;
  busy: boolean;
  onDisconnect: () => void;
}) {
  const isDark = useIsDark();
  const { t } = useI18n('accounts');

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={[styles.accountName, { color: isDark ? palette.text : palette.lightText }]}>
            {account.display_name || account.username}
          </Text>
          <Text style={[styles.handle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            @{account.username}@{account.instance_url.replace(/^https?:\/\//, '')}
          </Text>
        </View>
        {isDefault ? (
          <Text style={[styles.defaultBadge, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>{t('defaultBadge')}</Text>
        ) : null}
      </View>

      <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {t('metaStats', {
          type: account.instance_type,
          followers: account.stats_followers,
          following: account.stats_following,
        })}
      </Text>
      <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {t('metaEffective', {
          effective: account.effective_statuses_count,
          indexed: account.indexed_posts_count,
        })}
      </Text>

      {account.import_status ? (
        <Text style={[styles.infoBadge, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>
          {t('importStatus', { status: account.import_status })}
        </Text>
      ) : null}

      {account.auth_error_message ? (
        <Text style={styles.errorText}>{t('authError', { message: account.auth_error_message })}</Text>
      ) : null}

      <Button label={t('disconnect')} onPress={onDisconnect} variant="danger" disabled={busy} />
    </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headerBody: {
    flex: 1,
    gap: spacing.xs,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '700',
  },
  handle: {
    fontSize: 13,
  },
  defaultBadge: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
