import { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { HeatmapGrid } from '../../components/HeatmapGrid';
import { HorizontalBarList } from '../../components/HorizontalBarList';
import { LoadingView } from '../../components/LoadingView';
import { MetricCard } from '../../components/MetricCard';
import { Screen } from '../../components/Screen';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { useAccountDashboard } from '../../hooks/useAccountDashboard';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useIsDark } from '../../hooks/useIsDark';
import { useI18n, getI18n } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import type { DashboardStackParamList } from '../../navigation/types';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AccountDashboard'>;

const fallbackPeriods = [7, 30, 90, 365, 730, 0];

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

function asArray<T>(value: T[] | undefined | null) {
  return Array.isArray(value) ? value : [];
}

function compactNumber(value: number | undefined) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(1);
}

function shortDateLabel(value: string | undefined) {
  if (!value) {
    return 'n/a';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function formatTags(value: string[] | string | undefined) {
  if (!value) {
    return '';
  }

  return Array.isArray(value) ? value.join(' + ') : value;
}

const weekdayKeys = ['weekday0', 'weekday1', 'weekday2', 'weekday3', 'weekday4', 'weekday5', 'weekday6'] as const;

function weekdayLabel(day: number, language: string) {
  const { t } = getI18n(language, 'accountDashboard');
  const key = weekdayKeys[day];
  return key ? t(key) : t('weekdayFallback', { day });
}

function getDashboardErrorMessage(error: unknown, language: string) {
  const { t } = getI18n(language, 'accountDashboard');
  const message = getErrorMessage(error, t('defaultAnalyticsError'));

  if (/column reference "created_at" is ambiguous/i.test(message)) {
    return t('sqlAmbiguousError');
  }

  return message;
}

function formatInsightTitle(tip: { id?: string; title?: string }, language: string) {
  if (tip.title) {
    return tip.title;
  }

  const { t } = getI18n(language, 'accountDashboard');

  switch (tip.id) {
    case 'hashtag_winner': return t('insightHashtagWinner');
    case 'weekend_peak': return t('insightWeekendPeak');
    case 'best_time_window': return t('insightBestTimeWindow');
    case 'best_weekdays': return t('insightBestWeekdays');
    case 'text_better': return t('insightTextBetter');
    case 'media_better': return t('insightMediaBetter');
    case 'hashtag_overload': return t('insightHashtagOverload');
    case 'winner_format_repeat': return t('insightWinnerFormatRepeat');
    case 'hashtag_underused': return t('insightHashtagUnderused');
    default: return t('insightDefault');
  }
}

function formatInsightSummary(
  tip: { id?: string; summary?: string; reason?: string; evidence?: string[] | string | Record<string, unknown> },
  language: string,
) {
  if (tip.summary) return tip.summary;
  if (tip.reason) return tip.reason;

  const { t } = getI18n(language, 'accountDashboard');
  const evidence = asRecord(tip.evidence);
  if (!evidence) return t('noReadableSummary');

  switch (tip.id) {
    case 'hashtag_winner': {
      const tag = asString(evidence.tag) ?? 'this hashtag';
      const posts = asNumber(evidence.posts);
      const lift = asNumber(evidence.lift_percent);
      const avg = asNumber(evidence.avg_engagement);
      return t('insightHashtagWinnerSummary', {
        tag: tag.startsWith('#') ? tag : `#${tag}`,
        posts: posts ?? 0,
        lift: lift ?? 0,
        avg: avg ?? 0,
      });
    }
    case 'weekend_peak': {
      const lift = asNumber(evidence.lift_percent);
      const weekendPosts = asNumber(evidence.weekend_posts);
      const weekdayPosts = asNumber(evidence.weekday_posts);
      return t('insightWeekendPeakSummary', {
        lift: lift ?? 0,
        weekendPosts: weekendPosts ?? 0,
        weekdayPosts: weekdayPosts ?? 0,
      });
    }
    case 'best_time_window': {
      const start = asNumber(evidence.start_hour);
      const end = asNumber(evidence.end_hour);
      const lift = asNumber(evidence.lift_percent);
      const sample = asNumber(evidence.sample);
      return t('insightBestTimeWindowSummary', {
        start: start ?? 0,
        end: end ?? 0,
        lift: lift ?? 0,
        sample: sample ?? 0,
      });
    }
    case 'best_weekdays': {
      const rawDays = Array.isArray(evidence.days) ? evidence.days : [];
      const days = rawDays
        .map((value) => asNumber(value))
        .filter((value): value is number => value !== null)
        .map((day) => weekdayLabel(day, language))
        .join(` ${t('insightDefault') === 'Hinweis' ? 'und' : 'and'} `);
      const lift = asNumber(evidence.lift_percent);
      const sample = asNumber(evidence.sample);
      return t('insightBestWeekdaysSummary', { days: days || '–', lift: lift ?? 0, sample: sample ?? 0 });
    }
    case 'text_better': {
      const lift = asNumber(evidence.lift_percent);
      const mediaAvg = asNumber(evidence.media_avg);
      const textAvg = asNumber(evidence.text_avg);
      const mediaPosts = asNumber(evidence.media_posts);
      const textPosts = asNumber(evidence.text_posts);
      return t('insightTextBetterSummary', {
        lift: lift ?? 0,
        mediaAvg: mediaAvg ?? 0,
        textAvg: textAvg ?? 0,
        mediaPosts: mediaPosts ?? 0,
        textPosts: textPosts ?? 0,
      });
    }
    case 'media_better': {
      const lift = asNumber(evidence.lift_percent);
      const mediaAvg = asNumber(evidence.media_avg);
      const textAvg = asNumber(evidence.text_avg);
      return t('insightMediaBetterSummary', { lift: lift ?? 0, mediaAvg: mediaAvg ?? 0, textAvg: textAvg ?? 0 });
    }
    case 'hashtag_overload': {
      const avgHashtags = asNumber(evidence.avg_hashtags);
      const taggedPosts = asNumber(evidence.tagged_posts);
      return t('insightHashtagOverloadSummary', { avgHashtags: avgHashtags ?? 0, taggedPosts: taggedPosts ?? 0 });
    }
    case 'winner_format_repeat': {
      const topShare = asNumber(evidence.top_share_percent);
      const topPosts = asNumber(evidence.top_posts);
      return t('insightWinnerFormatRepeatSummary', { topPosts: topPosts ?? 0, topShare: topShare ?? 0 });
    }
    case 'hashtag_underused': {
      const coverage = asNumber(evidence.coverage_percent);
      const tagged = asNumber(evidence.tagged_posts);
      const total = asNumber(evidence.total_posts);
      return t('insightHashtagUnderusedSummary', { coverage: coverage ?? 0, tagged: tagged ?? 0, total: total ?? 0 });
    }
    default:
      return t('rawDataOnly');
  }
}

function firstSentence(value: string | undefined, language: string) {
  const { t } = getI18n(language, 'accountDashboard');
  if (!value) return t('noDetails');
  return value.replace(/<[^>]+>/g, '').trim() || t('noDetails');
}

export function AccountDashboardScreen({ navigation, route }: Props) {
  const isDark = useIsDark();
  const { t } = useI18n('accountDashboard');
  const appLanguage = useAppSettingsStore((state) => state.language);
  const bootstrapQuery = useBootstrap();
  const recoverFromAuthFailure = useAuthRecovery();
  const accounts = bootstrapQuery.data?.accounts ?? [];
  const resolvedInitialAccountId = route.params?.accountId ?? bootstrapQuery.data?.user.default_account_id ?? accounts[0]?.id ?? null;
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(resolvedInitialAccountId);
  const [selectedDays, setSelectedDays] = useState(30);
  const dashboardQuery = useAccountDashboard({
    accountId: selectedAccountId,
    days: selectedDays,
  });

  useEffect(() => {
    if (selectedAccountId === null && resolvedInitialAccountId !== null) {
      setSelectedAccountId(resolvedInitialAccountId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedInitialAccountId]);

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
        <LoadingView label={t('loadingAccounts')} />
      </Screen>
    );
  }

  if (accounts.length === 0) {
    return (
      <Screen>
        <EmptyState
          title={t('noAccountsTitle')}
          description={t('noAccountsDescription')}
        />
      </Screen>
    );
  }

  const availablePeriods = dashboardQuery.data?.period.available_periods ?? bootstrapQuery.data?.mobile_capabilities.dashboard_periods ?? fallbackPeriods;
  const dailyStats = asArray(dashboardQuery.data?.charts.daily_stats).slice(-7);
  const engagementRate = asArray(dashboardQuery.data?.charts.engagement_rate).slice(-7);
  const statsHistory = asArray(dashboardQuery.data?.charts.stats_history).slice(-7);
  const bestTimes = asArray(dashboardQuery.data?.charts.best_times);
  const mediaPerformance = asArray(dashboardQuery.data?.charts.media_performance);
  const weekdayEngagement = asArray(dashboardQuery.data?.charts.weekday_engagement);
  const visibilityBreakdown = asArray(dashboardQuery.data?.charts.visibility_breakdown);
  const topHashtags = asArray(dashboardQuery.data?.charts.top_hashtags);
  const hashtagCombinations = asArray(dashboardQuery.data?.charts.hashtag_combinations);
  const hashtagOverview = dashboardQuery.data?.charts.hashtag_overview;
  const mediaRow = mediaPerformance.find((entry) => entry.type === 'media');
  const textRow = mediaPerformance.find((entry) => entry.type === 'text');

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
        <Button label={t('goBack')} onPress={() => navigation.goBack()} variant="secondary" />
      </View>

      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('subtitle')}
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('selectAccount')}</Text>
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
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('periodTitle')}</Text>
        <View style={styles.periodWrap}>
          {availablePeriods.map((days) => (
            <Chip
              key={days}
              label={days === 0 ? t('allPeriod') : t('daysPeriod', { days })}
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
            {selectedAccount.instance_type} | {t('indexedPosts', { count: selectedAccount.indexed_posts_count })} | {t('effectivePosts', { count: selectedAccount.effective_statuses_count })}
          </Text>
          {selectedAccount.auth_error_message ? (
            <Text style={styles.errorText}>{t('authError', { message: selectedAccount.auth_error_message })}</Text>
          ) : null}
        </Card>
      ) : null}

      {dashboardQuery.isLoading ? (
        <LoadingView label={t('loadingAnalytics')} />
      ) : dashboardQuery.error ? (
        <ErrorStateView
          title={t('errorTitle')}
          message={getDashboardErrorMessage(dashboardQuery.error, appLanguage)}
          actionLabel={t('retryLabel')}
          onAction={() => void dashboardQuery.refetch()}
        />
      ) : !dashboardQuery.data ? (
        <EmptyState title={t('noAnalyticsTitle')} description={t('noAnalyticsDescription')} />
      ) : (
        <>
          <View style={styles.grid}>
            <MetricCard label={t('metricFollowers')} value={dashboardQuery.data.summary.followers} />
            <MetricCard label={t('metricFollowing')} value={dashboardQuery.data.summary.following} />
            <MetricCard label={t('metricPostsInPeriod')} value={dashboardQuery.data.summary.posts_in_period} tone="accent" />
            <MetricCard label={t('metricTotalEngagement')} value={dashboardQuery.data.summary.total_engagement} tone="accent" />
            <MetricCard label={t('metricAvgEngagement')} value={dashboardQuery.data.summary.avg_engagement_per_post.toFixed(1)} />
            <MetricCard label={t('metricFailedPosts')} value={dashboardQuery.data.summary.failed_posts_count} tone="danger" />
          </View>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('postingActivity')}</Text>
            <SimpleBarChart
              emptyLabel={t('emptyDailyStats')}
              data={dailyStats.map((entry) => ({
                label: shortDateLabel(entry.date),
                value: entry.posts_count ?? 0,
                detail: t('engShort', { count: (entry.total_favourites ?? 0) + (entry.total_reblogs ?? 0) + (entry.total_replies ?? 0) }),
              }))}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('engagementHistory')}</Text>
            <SimpleBarChart
              emptyLabel={t('emptyEngagement')}
              data={engagementRate.map((entry) => ({
                label: shortDateLabel(entry.date),
                value: entry.engagement_rate ?? 0,
                detail: t('postCount', { count: entry.posts_count ?? 0 }),
              }))}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('followerHistory')}</Text>
            <SimpleBarChart
              emptyLabel={t('emptyHistory')}
              data={statsHistory.map((entry) => ({
                label: shortDateLabel(entry.recorded_at),
                value: entry.followers ?? 0,
                detail: t('following', { count: entry.following ?? 0 }),
              }))}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('bestTimes')}</Text>
            <HeatmapGrid
              emptyLabel={t('emptyHeatmap')}
              data={bestTimes.map((entry) => ({
                day: entry.day_of_week ?? 0,
                hour: entry.hour ?? 0,
                value: entry.avg_engagement ?? 0,
              }))}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('weekdays')}</Text>
            <HorizontalBarList
              emptyLabel={t('emptyWeekdays')}
              data={weekdayEngagement.map((entry) => ({
                label: weekdayLabel(entry.day_of_week ?? -1, appLanguage),
                value: entry.avg_engagement ?? 0,
                meta: t('postCount', { count: entry.post_count ?? 0 }),
              }))}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('topPostsTitle')}</Text>
            {dashboardQuery.data.top_posts.items.length === 0 ? (
              <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {t('noTopPosts')}
              </Text>
            ) : (
              dashboardQuery.data.top_posts.items.slice(0, 5).map((post, index) => (
                <View key={`${post.id ?? index}`} style={styles.listItem}>
                  <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                    {firstSentence(post.content, appLanguage)}
                  </Text>
                  <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                    {t('topPostMeta', {
                      eng: post.total_engagement ?? 0,
                      vis: post.visibility ?? t('unknown'),
                      media: post.has_media ? t('yes') : t('no'),
                    })}
                  </Text>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('mediaVsText')}</Text>
            <View style={styles.grid}>
              <MetricCard label={t('mediaPosts')} value={mediaRow?.post_count ?? 0} tone="accent" />
              <MetricCard label={t('textPosts')} value={textRow?.post_count ?? 0} />
              <MetricCard label={t('avgMediaEngagement')} value={compactNumber(mediaRow?.avg_engagement)} tone="accent" />
              <MetricCard label={t('avgTextEngagement')} value={compactNumber(textRow?.avg_engagement)} />
            </View>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {t('avgFavourites', {
                media: compactNumber(mediaRow?.avg_favourites),
                text: compactNumber(textRow?.avg_favourites),
              })}
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {t('avgBoosts', {
                media: compactNumber(mediaRow?.avg_boosts),
                text: compactNumber(textRow?.avg_boosts),
              })}
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {t('avgReplies', {
                media: compactNumber(mediaRow?.avg_replies),
                text: compactNumber(textRow?.avg_replies),
              })}
            </Text>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('visibilityTitle')}</Text>
            <HorizontalBarList
              emptyLabel={t('emptyVisibility')}
              data={visibilityBreakdown.map((entry) => ({
                label: entry.visibility ?? t('unknown'),
                value: entry.post_count ?? entry.count ?? 0,
              }))}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('hashtagsTitle')}</Text>
            <View style={styles.grid}>
              <MetricCard label={t('postsWithHashtags')} value={hashtagOverview?.posts_with_hashtags ?? 0} tone="accent" />
              <MetricCard label={t('postsWithoutHashtags')} value={hashtagOverview?.posts_without_hashtags ?? 0} />
              <MetricCard label={t('uniqueHashtags')} value={hashtagOverview?.unique_hashtags ?? 0} tone="accent" />
              <MetricCard label={t('hashtagUses')} value={hashtagOverview?.hashtag_uses ?? 0} />
            </View>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {t('avgHashtagsPerPost', {
                avg: compactNumber(hashtagOverview?.avg_hashtags_per_post),
                avgTagged: compactNumber(hashtagOverview?.avg_hashtags_per_tagged_post),
              })}
            </Text>
            <SimpleBarChart
              emptyLabel={t('emptyHashtags')}
              data={topHashtags.slice(0, 5).map((tag) => ({
                label: `#${tag.tag ?? t('unknown')}`,
                value: tag.avg_engagement ?? 0,
                detail: t('postCount', { count: tag.posts_count ?? 0 }),
              }))}
            />
            {topHashtags.slice(0, 5).map((tag, index) => (
              <View key={`${tag.tag ?? index}`} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                  #{tag.tag ?? t('unknown')}
                </Text>
                <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                  {t('hashtagComboMeta', {
                    posts: tag.posts_count ?? 0,
                    eng: tag.total_engagement ?? 0,
                    avg: tag.avg_engagement ?? 0,
                  })}
                </Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('hashtagCombinationsTitle')}</Text>
            {hashtagCombinations.length === 0 ? (
              <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {t('noHashtagCombinations')}
              </Text>
            ) : null}
            {hashtagCombinations.slice(0, 5).map((combo, index) => (
              <View key={`${combo.tag_a ?? 'tag'}-${combo.tag_b ?? 'tag'}-${index}`} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                  {combo.tag_a || combo.tag_b
                    ? `#${combo.tag_a ?? t('unknown')} + #${combo.tag_b ?? t('unknown')}`
                    : formatTags(combo.tags)}
                </Text>
                <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                  {t('hashtagComboMeta', {
                    posts: combo.posts_count ?? 0,
                    eng: combo.total_engagement ?? 0,
                    avg: combo.avg_engagement ?? 0,
                  })}
                </Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('insightsTitle')}</Text>
            {(dashboardQuery.data.insights.tips ?? []).length === 0 ? (
              <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {t('noInsights')}
              </Text>
            ) : (
              dashboardQuery.data.insights.tips?.map((tip, index) => (
                <View key={`${tip.title ?? index}`} style={styles.listItem}>
                  <Text style={[styles.listTitle, { color: isDark ? palette.text : palette.lightText }]}>
                    {formatInsightTitle(tip, appLanguage)}
                  </Text>
                  <Text style={[styles.confidence, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>
                    {tip.confidence ?? 'medium'}
                  </Text>
                  <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                    {formatInsightSummary(tip, appLanguage)}
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
