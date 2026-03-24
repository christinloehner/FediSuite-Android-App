import { useQueryClient } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { LoadingView } from '../../components/LoadingView';
import { MetricCard } from '../../components/MetricCard';
import { NoticeBanner } from '../../components/NoticeBanner';
import { Screen } from '../../components/Screen';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import type { DashboardStackParamList } from '../../navigation/types';
import { useInstanceStore } from '../../store/instanceStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Home'>;

export function HomeDashboardScreen({ navigation }: Props) {
  const isDark = useColorScheme() !== 'light';
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const bootstrapQuery = useBootstrap();
  const recoverFromAuthFailure = useAuthRecovery();

  if (bootstrapQuery.isLoading) {
    return (
      <Screen>
        <LoadingView label="Bootstrap-Daten werden geladen..." />
      </Screen>
    );
  }

  if (bootstrapQuery.error) {
    if (isAuthError(bootstrapQuery.error) && instanceUrl) {
      void recoverFromAuthFailure();
    }

    return (
      <Screen>
        <ErrorStateView
          title="Dashboard konnte nicht geladen werden"
          message={getErrorMessage(bootstrapQuery.error)}
          actionLabel="Erneut laden"
          onAction={() => void bootstrapQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!bootstrapQuery.data) {
    return (
      <Screen>
        <EmptyState title="Keine Daten" description="Die Instanz hat noch keine Bootstrap-Daten geliefert." />
      </Screen>
    );
  }

  const { summary, accounts, notice, user } = bootstrapQuery.data;

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={bootstrapQuery.isRefetching} onRefresh={() => void bootstrapQuery.refetch()} />
      }
    >
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {instanceUrl}
        </Text>
      </View>

      {notice.enabled && notice.markdown ? <NoticeBanner markdown={notice.markdown} /> : null}

      <View style={styles.grid}>
        <MetricCard label="Accounts" value={summary.account_count} />
        <MetricCard label="Follower gesamt" value={summary.total_followers} tone="accent" />
        <MetricCard label="Geplante Posts" value={summary.scheduled_posts} />
        <MetricCard label="Fehlgeschlagene Posts" value={summary.failed_posts} tone="danger" />
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Dein Profil</Text>
        <Text style={[styles.profileLine, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {user.email}
        </Text>
        <Text style={[styles.profileLine, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Sprache: {user.language} | Zeitzone: {user.timezone}
        </Text>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState
          title="Keine verbundenen Accounts"
          description="Die Instanz ist erreichbar und du bist angemeldet, aber es gibt noch keine verbundenen Fediverse-Accounts."
        />
      ) : (
        <Card>
          <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Accounts</Text>
          <View style={styles.accountList}>
            {accounts.map((account) => (
              <View
                key={account.id}
                style={[styles.accountCard, { backgroundColor: isDark ? palette.panelMuted : palette.surfaceMuted }]}
              >
                <Text style={[styles.accountName, { color: isDark ? palette.text : palette.lightText }]}>
                  {account.display_name || account.username}
                </Text>
                <Text style={[styles.accountHandle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                  @{account.username}@{account.instance_url.replace(/^https?:\/\//, '')}
                </Text>
                <Text style={[styles.accountMeta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                  {account.instance_type} | {account.stats_followers} Follower | {account.effective_statuses_count} Posts
                </Text>
                {account.auth_error_message ? (
                  <Text style={styles.errorBadge}>Auth-Fehler: {account.auth_error_message}</Text>
                ) : null}
                {account.import_status ? (
                  <Text style={[styles.importBadge, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>
                    Import: {account.import_status}
                  </Text>
                ) : null}
                <Button
                  label="Analytics öffnen"
                  onPress={() => navigation.navigate('AccountDashboard', { accountId: account.id })}
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        </Card>
      )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  accountList: {
    gap: spacing.sm,
  },
  accountCard: {
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.xs,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountHandle: {
    fontSize: 13,
  },
  accountMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorBadge: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  importBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
});
