import { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { LoadingView } from '../../components/LoadingView';
import { MetricCard } from '../../components/MetricCard';
import { Screen } from '../../components/Screen';
import { useAccountDashboard } from '../../hooks/useAccountDashboard';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import type { DashboardStackParamList } from '../../navigation/types';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AccountDashboard'>;

const fallbackPeriods = [7, 30, 90, 365, 730, 0];

function formatPeriod(days: number) {
  return days === 0 ? 'Alle' : `${days} Tage`;
}

function firstSentence(value: string | undefined) {
  if (!value) {
    return 'Keine zusätzlichen Details vorhanden.';
  }

  return value.replace(/<[^>]+>/g, '').trim() || 'Keine zusätzlichen Details vorhanden.';
}

function formatTags(value: string[] | string | undefined) {
  if (!value) {
    return 'Unbekannt';
  }

  return Array.isArray(value) ? value.join(' + ') : value;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function weekdayLabel(day: number) {
  const labels = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return labels[day] ?? `Tag ${day}`;
}

function formatInsightTitle(tip: {
  id?: string;
  title?: string;
}) {
  if (tip.title) {
    return tip.title;
  }

  switch (tip.id) {
    case 'hashtag_winner':
      return 'Starker Hashtag';
    case 'weekend_peak':
      return 'Wochenende performt besser';
    case 'best_time_window':
      return 'Bestes Zeitfenster';
    case 'best_weekdays':
      return 'Starke Wochentage';
    case 'text_better':
      return 'Text schlägt Medien';
    case 'media_better':
      return 'Medien schlagen Text';
    case 'hashtag_overload':
      return 'Viele Hashtags bremsen';
    case 'winner_format_repeat':
      return 'Erfolgsformat wiederholen';
    case 'hashtag_underused':
      return 'Hashtags werden zu selten genutzt';
    default:
      return 'Hinweis';
  }
}

function formatInsightSummary(tip: {
  id?: string;
  summary?: string;
  reason?: string;
  evidence?: string[] | string | Record<string, unknown>;
}) {
  if (tip.summary) {
    return tip.summary;
  }

  if (tip.reason) {
    return tip.reason;
  }

  const evidence = asRecord(tip.evidence);
  if (!evidence) {
    return 'Die Instanz hat für diesen Insight noch keine lesbare Beschreibung geliefert.';
  }

  switch (tip.id) {
    case 'hashtag_winner': {
      const tag = asString(evidence.tag) ?? 'dieser Hashtag';
      const posts = asNumber(evidence.posts);
      const lift = asNumber(evidence.lift_percent);
      const avg = asNumber(evidence.avg_engagement);
      return `${tag.startsWith('#') ? tag : `#${tag}`} lag in ${posts ?? 0} Posts im Schnitt bei ${avg ?? 0} Engagement und hebt die Performance um etwa ${lift ?? 0}%.`;
    }
    case 'weekend_peak': {
      const lift = asNumber(evidence.lift_percent);
      const weekendPosts = asNumber(evidence.weekend_posts);
      const weekdayPosts = asNumber(evidence.weekday_posts);
      return `Wochenend-Posts performen etwa ${lift ?? 0}% besser. Grundlage sind ${weekendPosts ?? 0} Wochenend-Posts gegenüber ${weekdayPosts ?? 0} Werktags-Posts.`;
    }
    case 'best_time_window': {
      const start = asNumber(evidence.start_hour);
      const end = asNumber(evidence.end_hour);
      const lift = asNumber(evidence.lift_percent);
      const sample = asNumber(evidence.sample);
      return `Zwischen ${start ?? 0}:00 und ${end ?? 0}:00 liegt dein bestes Zeitfenster. In ${sample ?? 0} ausgewerteten Posts lag der Performance-Vorteil bei etwa ${lift ?? 0}%.`;
    }
    case 'best_weekdays': {
      const rawDays = Array.isArray(evidence.days) ? evidence.days : [];
      const days = rawDays.map((value) => asNumber(value)).filter((value): value is number => value !== null);
      const lift = asNumber(evidence.lift_percent);
      const sample = asNumber(evidence.sample);
      const labels = days.map(weekdayLabel).join(' und ');
      return `${labels || 'Diese Wochentage'} schneiden besonders gut ab. In ${sample ?? 0} Posts lag der Performance-Vorteil bei etwa ${lift ?? 0}%.`;
    }
    case 'text_better': {
      const lift = asNumber(evidence.lift_percent);
      const mediaAvg = asNumber(evidence.media_avg);
      const textAvg = asNumber(evidence.text_avg);
      const mediaPosts = asNumber(evidence.media_posts);
      const textPosts = asNumber(evidence.text_posts);
      return `Text-Posts performen aktuell etwa ${lift ?? 0}% besser als Medien-Posts. Ø Engagement: Text ${textAvg ?? 0}, Medien ${mediaAvg ?? 0} bei ${textPosts ?? 0} Text- und ${mediaPosts ?? 0} Medien-Posts.`;
    }
    case 'media_better': {
      const lift = asNumber(evidence.lift_percent);
      const mediaAvg = asNumber(evidence.media_avg);
      const textAvg = asNumber(evidence.text_avg);
      return `Medien-Posts performen aktuell etwa ${lift ?? 0}% besser als reine Text-Posts. Ø Engagement: Medien ${mediaAvg ?? 0}, Text ${textAvg ?? 0}.`;
    }
    case 'hashtag_overload': {
      const avgHashtags = asNumber(evidence.avg_hashtags);
      const taggedPosts = asNumber(evidence.tagged_posts);
      return `Deine markierten Posts nutzen im Schnitt ${avgHashtags ?? 0} Hashtags. Das wirkt nach Überladung und betrifft ${taggedPosts ?? 0} ausgewertete Posts.`;
    }
    case 'winner_format_repeat': {
      const topShare = asNumber(evidence.top_share_percent);
      const topPosts = asNumber(evidence.top_posts);
      return `Ein wiederkehrendes Erfolgsformat ist erkennbar: ${topPosts ?? 0} Top-Posts stehen für etwa ${topShare ?? 0}% deiner stärksten Beiträge.`;
    }
    case 'hashtag_underused': {
      const coverage = asNumber(evidence.coverage_percent);
      const tagged = asNumber(evidence.tagged_posts);
      const total = asNumber(evidence.total_posts);
      return `Nur etwa ${coverage ?? 0}% deiner Posts nutzen Hashtags. Das sind ${tagged ?? 0} von ${total ?? 0} Beiträgen und lässt Reichweitenpotenzial liegen.`;
    }
    default:
      return 'Die Instanz hat für diesen Insight nur Rohdaten geliefert. Eine lesbare Beschreibung liegt noch nicht vor.';
  }
}

function getDashboardErrorMessage(error: unknown) {
  const message = getErrorMessage(error, 'Die Analytics-Daten konnten nicht geladen werden.');

  if (/column reference "created_at" is ambiguous/i.test(message)) {
    return 'Die Instanz hat das Analytics-Dashboard mit einem Serverfehler beantwortet. Die SQL-Abfrage auf dem Server verwendet die Spalte "created_at" derzeit nicht eindeutig. Die App funktioniert, aber dieser Analytics-Endpunkt muss serverseitig korrigiert werden.';
  }

  return message;
}

export function AccountDashboardScreen({ navigation, route }: Props) {
  const isDark = useColorScheme() !== 'light';
  const bootstrapQuery = useBootstrap();
  const recoverFromAuthFailure = useAuthRecovery();
  const accounts = bootstrapQuery.data?.accounts ?? [];
  const initialAccountId = route.params?.accountId ?? bootstrapQuery.data?.user.default_account_id ?? accounts[0]?.id ?? null;
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(initialAccountId);
  const [selectedDays, setSelectedDays] = useState(30);
  const dashboardQuery = useAccountDashboard({
    accountId: selectedAccountId,
    days: selectedDays,
  });

  useEffect(() => {
    if (dashboardQuery.error && isAuthError(dashboardQuery.error)) {
      void recoverFromAuthFailure();
    }
  }, [dashboardQuery.error, recoverFromAuthFailure]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  if (bootstrapQuery.isLoading && accounts.length === 0) {
    return (
      <Screen>
        <LoadingView label="Accounts werden geladen..." />
      </Screen>
    );
  }

  if (accounts.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Keine Accounts für Analytics"
          description="Verbinde zuerst mindestens einen Fediverse-Account, bevor du das mobile Analytics-Dashboard aufrufst."
        />
      </Screen>
    );
  }

  const availablePeriods = dashboardQuery.data?.period.available_periods ?? bootstrapQuery.data?.mobile_capabilities.dashboard_periods ?? fallbackPeriods;

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={dashboardQuery.isRefetching}
          onRefresh={() => void dashboardQuery.refetch()}
        />
      }
    >
      <View style={styles.topBar}>
        <Button label="Zurück" onPress={() => navigation.goBack()} variant="secondary" />
      </View>

      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Account Dashboard</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Mobile Analytics aus einem Bundle-Endpunkt
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Account wählen</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {accounts.map((account) => (
              <Chip
                key={account.id}
                label={account.display_name || `@${account.username}`}
                active={selectedAccountId === account.id}
                onPress={() => setSelectedAccountId(account.id)}
              />
            ))}
          </View>
        </ScrollView>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Zeitraum</Text>
        <View style={styles.periodWrap}>
          {availablePeriods.map((days) => (
            <Chip
              key={days}
              label={formatPeriod(days)}
              active={selectedDays === days}
              onPress={() => setSelectedDays(days)}
            />
          ))}
        </View>
      </Card>

      {selectedAccount ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>
            {selectedAccount.display_name || selectedAccount.username}
          </Text>
          <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            @{selectedAccount.username}@{selectedAccount.instance_url.replace(/^https?:\/\//, '')}
          </Text>
          <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            {selectedAccount.instance_type} | Indexierte Posts: {selectedAccount.indexed_posts_count} | Effektive Posts: {selectedAccount.effective_statuses_count}
          </Text>
          {selectedAccount.auth_error_message ? (
            <Text style={styles.errorText}>Auth-Fehler: {selectedAccount.auth_error_message}</Text>
          ) : null}
        </Card>
      ) : null}

      {dashboardQuery.isLoading ? (
        <LoadingView label="Analytics werden geladen..." />
      ) : dashboardQuery.error ? (
        <ErrorStateView
          title="Analytics konnten nicht geladen werden"
          message={getDashboardErrorMessage(dashboardQuery.error)}
          actionLabel="Erneut laden"
          onAction={() => void dashboardQuery.refetch()}
        />
      ) : !dashboardQuery.data ? (
        <EmptyState title="Keine Analytics-Daten" description="Die Instanz hat noch keine Dashboard-Daten zurückgegeben." />
      ) : (
        <>
          <View style={styles.grid}>
            <MetricCard label="Follower" value={dashboardQuery.data.summary.followers} />
            <MetricCard label="Following" value={dashboardQuery.data.summary.following} />
            <MetricCard label="Posts im Zeitraum" value={dashboardQuery.data.summary.posts_in_period} tone="accent" />
            <MetricCard label="Engagement gesamt" value={dashboardQuery.data.summary.total_engagement} tone="accent" />
            <MetricCard label="Ø Engagement" value={dashboardQuery.data.summary.avg_engagement_per_post.toFixed(1)} />
            <MetricCard label="Fehlgeschlagene Posts" value={dashboardQuery.data.summary.failed_posts_count} tone="danger" />
          </View>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Chart-Summary</Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Daily Stats: {Array.isArray(dashboardQuery.data.charts.daily_stats) ? dashboardQuery.data.charts.daily_stats.length : 0} Punkte
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Engagement Rate: {Array.isArray(dashboardQuery.data.charts.engagement_rate) ? dashboardQuery.data.charts.engagement_rate.length : 0} Punkte
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Follower-Historie: {Array.isArray(dashboardQuery.data.charts.stats_history) ? dashboardQuery.data.charts.stats_history.length : 0} Punkte
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Best Times: {Array.isArray(dashboardQuery.data.charts.best_times) ? dashboardQuery.data.charts.best_times.length : 0} Slots
            </Text>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Top Posts</Text>
            {dashboardQuery.data.top_posts.items.length === 0 ? (
              <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                Für diesen Zeitraum gibt es noch keine Top-Posts.
              </Text>
            ) : (
              dashboardQuery.data.top_posts.items.slice(0, 5).map((post, index) => (
                <View key={`${post.id ?? index}`} style={styles.listItem}>
                  <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                    {firstSentence(post.content)}
                  </Text>
                  <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                    Engagement {post.total_engagement ?? 0} | Sichtbarkeit {post.visibility ?? 'unbekannt'} | Medien {post.has_media ? 'ja' : 'nein'}
                  </Text>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Medien vs. Text</Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Media Posts: {dashboardQuery.data.charts.media_performance?.media_posts ?? 0} | Ø Engagement {dashboardQuery.data.charts.media_performance?.media_avg_engagement ?? 0}
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Text Posts: {dashboardQuery.data.charts.media_performance?.text_posts ?? 0} | Ø Engagement {dashboardQuery.data.charts.media_performance?.text_avg_engagement ?? 0}
            </Text>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Hashtags</Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Unique Hashtags: {dashboardQuery.data.charts.hashtag_overview?.unique_hashtags ?? 0} | Uses: {dashboardQuery.data.charts.hashtag_overview?.hashtag_uses ?? 0}
            </Text>
            {(dashboardQuery.data.charts.top_hashtags ?? []).slice(0, 5).map((tag, index) => (
              <View key={`${tag.tag ?? index}`} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                  #{tag.tag ?? 'unbekannt'}
                </Text>
                <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                  Posts {tag.posts_count ?? 0} | Engagement {tag.total_engagement ?? 0} | Ø {tag.avg_engagement ?? 0}
                </Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Hashtag-Kombinationen</Text>
            {(dashboardQuery.data.charts.hashtag_combinations ?? []).slice(0, 5).map((combo, index) => (
              <View key={`${formatTags(combo.tags)}-${index}`} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                  {formatTags(combo.tags)}
                </Text>
                <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                  Posts {combo.posts_count ?? 0} | Engagement {combo.total_engagement ?? 0} | Ø {combo.avg_engagement ?? 0}
                </Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Insights und Tipps</Text>
            {(dashboardQuery.data.insights.tips ?? []).length === 0 ? (
              <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                Noch nicht genug Daten für automatisierte Tipps.
              </Text>
            ) : (
              dashboardQuery.data.insights.tips?.map((tip, index) => (
                <View key={`${tip.title ?? index}`} style={styles.listItem}>
                  <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                    {formatInsightTitle(tip)}
                  </Text>
                  <Text style={[styles.confidence, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>
                    {tip.confidence ?? 'medium'}
                  </Text>
                  <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                    {formatInsightSummary(tip)}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'flex-start',
  },
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  periodWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  listItem: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
    gap: spacing.xs,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  confidence: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
