import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { disconnectAccount } from '../../api/accounts';
import type { BootstrapAccount } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { LoadingView } from '../../components/LoadingView';
import { Screen } from '../../components/Screen';
import { useAccounts } from '../../hooks/useAccounts';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';

export function AccountsScreen() {
  const isDark = useColorScheme() !== 'light';
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const bootstrapQuery = useBootstrap();
  const accountsQuery = useAccounts();
  const recoverFromAuthFailure = useAuthRecovery();

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: number) => {
      if (!instanceUrl || !token) {
        throw new Error('Keine aktive Sitzung vorhanden.');
      }

      return disconnectAccount(instanceUrl, token, language, accountId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
    },
    onError: async (error) => {
      if (isAuthError(error) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  if (accountsQuery.isLoading) {
    return (
      <Screen>
        <LoadingView label="Accounts werden geladen..." />
      </Screen>
    );
  }

  if (accountsQuery.error) {
    if (isAuthError(accountsQuery.error) && instanceUrl) {
      void recoverFromAuthFailure();
    }

    return (
      <Screen>
        <ErrorStateView
          title="Accounts konnten nicht geladen werden"
          message={getErrorMessage(accountsQuery.error)}
          actionLabel="Erneut laden"
          onAction={() => void accountsQuery.refetch()}
        />
      </Screen>
    );
  }

  const accounts = accountsQuery.data ?? [];
  const defaultAccountId = bootstrapQuery.data?.user.default_account_id ?? null;

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={accountsQuery.isRefetching} onRefresh={() => void accountsQuery.refetch()} />}
    >
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Accounts</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Verbundene Fediverse-Accounts, Importstatus und Auth-Probleme
        </Text>
      </View>

      {accounts.length === 0 ? (
        <EmptyState
          title="Keine Accounts verbunden"
          description="Die Instanz hat aktuell keine verbundenen Fediverse-Accounts für diesen Benutzer."
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
  const isDark = useColorScheme() !== 'light';

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
          <Text style={[styles.defaultBadge, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>Default</Text>
        ) : null}
      </View>

      <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {account.instance_type} | Follower {account.stats_followers} | Following {account.stats_following}
      </Text>
      <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        Effektive Posts {account.effective_statuses_count} | Indexed {account.indexed_posts_count}
      </Text>

      {account.import_status ? (
        <Text style={[styles.infoBadge, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>
          Import: {account.import_status}
        </Text>
      ) : null}

      {account.auth_error_message ? (
        <Text style={styles.errorText}>Auth-Fehler: {account.auth_error_message}</Text>
      ) : null}

      <Button label="Disconnect" onPress={onDisconnect} variant="danger" disabled={busy} />
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
