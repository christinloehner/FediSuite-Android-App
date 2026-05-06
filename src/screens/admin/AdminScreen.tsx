import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { updateAdminNotice } from '../../api/admin';
import type { AdminUser } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { LoadingView } from '../../components/LoadingView';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAdminNotice } from '../../hooks/useAdminNotice';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useIsDark } from '../../hooks/useIsDark';
import { useI18n } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';

const ADMIN_USERS_PAGE_SIZE = 20;

export function AdminScreen() {
  const isDark = useIsDark();
  const bootstrapQuery = useBootstrap();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const appLanguage = useAppSettingsStore((state) => state.language);
  const { t } = useI18n('admin');
  const queryClient = useQueryClient();
  const recoverFromAuthFailure = useAuthRecovery();
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [noticeMarkdown, setNoticeMarkdown] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput.trim());
  const noticeQuery = useAdminNotice();
  const usersQuery = useAdminUsers({
    page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    search: deferredSearch,
  });

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (noticeQuery.data) {
      setNoticeEnabled(Boolean(noticeQuery.data.enabled));
      setNoticeMarkdown(noticeQuery.data.markdown ?? '');
    }
  }, [noticeQuery.data]);

  useEffect(() => {
    if (noticeQuery.error && isAuthError(noticeQuery.error) && instanceUrl) {
      void recoverFromAuthFailure();
    }
  }, [instanceUrl, noticeQuery.error, recoverFromAuthFailure]);

  useEffect(() => {
    if (usersQuery.error && isAuthError(usersQuery.error) && instanceUrl) {
      void recoverFromAuthFailure();
    }
  }, [instanceUrl, recoverFromAuthFailure, usersQuery.error]);

  const saveNoticeMutation = useMutation({
    mutationFn: async () => {
      if (!instanceUrl || !token) {
        throw new Error('Keine aktive Sitzung vorhanden.');
      }

      return updateAdminNotice(instanceUrl, token, language, {
        enabled: noticeEnabled,
        markdown: noticeMarkdown,
      });
    },
    onSuccess: async (notice) => {
      setNoticeEnabled(Boolean(notice.enabled));
      setNoticeMarkdown(notice.markdown ?? '');
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'admin', 'notice'] });
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
      Alert.alert(t('noticeTitle'), t('noticeSaved'));
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
        <LoadingView label={t('title')} />
      </Screen>
    );
  }

  if (!bootstrapQuery.data?.user.is_admin) {
    return (
      <Screen>
        <EmptyState
          title={t('noAccessTitle')}
          description={t('noAccessDescription')}
        />
      </Screen>
    );
  }

  const noticeError =
    saveNoticeMutation.error && !isAuthError(saveNoticeMutation.error)
      ? getErrorMessage(saveNoticeMutation.error)
      : noticeQuery.error && !isAuthError(noticeQuery.error)
        ? getErrorMessage(noticeQuery.error)
        : null;
  const usersError = usersQuery.error && !isAuthError(usersQuery.error) ? getErrorMessage(usersQuery.error) : null;
  const usersData = usersQuery.data;
  const users = usersData?.items ?? [];
  const pagination = usersData?.pagination;
  const refreshControl = (
    <RefreshControl
      refreshing={noticeQuery.isRefetching || usersQuery.isRefetching}
      onRefresh={() => {
        void noticeQuery.refetch();
        void usersQuery.refetch();
      }}
    />
  );

  const handleSaveNotice = () => {
    if (noticeEnabled && !noticeMarkdown.trim()) {
      Alert.alert(t('noticeTitle'), t('noticeValidation'));
      return;
    }

    saveNoticeMutation.mutate();
  };

  return (
    <Screen scrollable refreshControl={refreshControl}>
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          {t('subtitle')}
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('noticeTitle')}</Text>
        {noticeQuery.isLoading ? (
          <LoadingView label={t('noticeTitle')} />
        ) : noticeError ? (
          <ErrorStateView
            title={t('noticeLoadErrorTitle')}
            message={noticeError}
            actionLabel={t('refresh')}
            onAction={() => void noticeQuery.refetch()}
          />
        ) : (
          <>
            <Text style={[styles.statusText, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {noticeEnabled ? t('noticeEnabled') : t('noticeDisabled')}
            </Text>
            <View style={styles.noticeActions}>
              <Button
                label={noticeEnabled ? t('noticeDisabled') : t('noticeEnabled')}
                onPress={() => setNoticeEnabled((current) => !current)}
                variant="secondary"
              />
            </View>
            <TextField
              label={t('noticeLabel')}
              value={noticeMarkdown}
              onChangeText={setNoticeMarkdown}
              multiline
              style={[styles.textArea, { textAlignVertical: 'top' }]}
              hint={t('noticeHint')}
            />
            <Text style={[styles.previewTitle, { color: isDark ? palette.text : palette.lightText }]}>
              {t('noticePreviewTitle')}
            </Text>
            <Text style={[styles.previewHint, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              Rohtext – Markdown-Formatierung wird beim Anzeigen der Hinweisleiste gerendert.
            </Text>
            <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {noticeMarkdown.trim() ? noticeMarkdown : t('noticePreviewEmpty')}
            </Text>
            <Button
              label={t('noticeSave')}
              onPress={handleSaveNotice}
              loading={saveNoticeMutation.isPending}
              disabled={noticeQuery.isLoading}
            />
          </>
        )}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('usersTitle')}</Text>
        <TextField
          label={t('usersSearchLabel')}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={t('usersSearchPlaceholder')}
          hint={t('usersSearchHint')}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {usersError ? (
          <ErrorStateView
            title={t('usersLoadErrorTitle')}
            message={usersError}
            actionLabel={t('refresh')}
            onAction={() => void usersQuery.refetch()}
          />
        ) : usersQuery.isLoading ? (
          <LoadingView label={t('usersTitle')} />
        ) : users.length === 0 ? (
          <EmptyState title={t('usersEmptyTitle')} description={t('usersEmptyDescription')} />
        ) : (
          <>
            <Text style={[styles.statusText, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
              {t('pageStatus', {
                page: pagination?.page ?? 1,
                totalPages: pagination?.total_pages ?? 1,
                totalItems: pagination?.total_items ?? 0,
              })}
            </Text>
            {users.map((user) => (
              <AdminUserCard key={user.id} user={user} language={appLanguage} />
            ))}
            <View style={styles.pagination}>
              <Button
                label={t('previousPage')}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                variant="secondary"
                disabled={!pagination?.has_previous_page || usersQuery.isFetching}
              />
              <Button
                label={t('nextPage')}
                onPress={() => setPage((current) => current + 1)}
                variant="secondary"
                disabled={!pagination?.has_next_page || usersQuery.isFetching}
              />
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

function AdminUserCard({ user, language }: { user: AdminUser; language: string }) {
  const isDark = useIsDark();
  const { t } = useI18n('admin');
  const accounts = Array.isArray(user.accounts) ? user.accounts.filter(Boolean) : [];

  return (
    <Card>
      <Text style={[styles.userEmail, { color: isDark ? palette.text : palette.lightText }]}>{user.email}</Text>
      <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {t('userId')}: {user.id} | {t('userCreatedAt')}: {formatDate(user.created_at, language, t('unknownDate'))}
      </Text>
      <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {t('userVerified')}: {user.is_verified ? t('userVerifiedYes') : t('userVerifiedNo')} | {t('userAccounts')}:{' '}
        {user.account_count ?? 0}
      </Text>
      <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {t('userFollowers')}: {user.total_followers ?? 0} | {t('userScheduledPosts')}: {user.scheduled_posts_count ?? 0}
      </Text>

      <View style={styles.accountsList}>
        <Text style={[styles.accountsTitle, { color: isDark ? palette.text : palette.lightText }]}>
          {t('userAccountsTitle')}
        </Text>
        {accounts.length === 0 ? (
          <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
            {t('userNoAccounts')}
          </Text>
        ) : (
          accounts.map((account, index) => (
            <View
              key={`${user.id}-${account.instance_url ?? 'instance'}-${account.username ?? 'user'}-${index}`}
              style={[styles.accountRow, { borderColor: isDark ? palette.line : palette.lightLine }]}
            >
              <Text style={[styles.accountText, { color: isDark ? palette.text : palette.lightText }]}>
                @{account.username ?? 'unknown'} · {account.instance_url ?? t('unknownPlatform')}
              </Text>
              <Text style={[styles.body, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {(account.instance_type ?? t('unknownPlatform')).toLowerCase()} ·{' '}
                {t('userAccountFollowers', { count: account.stats_followers ?? 0 })}
              </Text>
            </View>
          ))
        )}
      </View>
    </Card>
  );
}

function formatDate(value: string | null | undefined, language: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString(language);
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
  textArea: {
    minHeight: 160,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewHint: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
  },
  noticeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  accountsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  accountText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
