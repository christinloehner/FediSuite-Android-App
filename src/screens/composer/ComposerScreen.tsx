import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { createScheduledPost, publishPostNow } from '../../api/posts';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useIsDark } from '../../hooks/useIsDark';
import { useI18n } from '../../i18n';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import {
  buildScheduledAt,
  getAllowedMediaCount,
  getComposerConstraints,
  type ComposerMediaItem,
  type ComposerVisibility,
} from '../../utils/composer';
import { getErrorMessage, isAuthError } from '../../utils/error';

export function ComposerScreen() {
  const isDark = useIsDark();
  const { t } = useI18n('composer');
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const bootstrapQuery = useBootstrap();
  const recoverFromAuthFailure = useAuthRecovery();

  const accounts = bootstrapQuery.data?.accounts ?? [];
  const resolvedDefaultAccountId = bootstrapQuery.data?.user.default_account_id ?? accounts[0]?.id ?? null;
  const [accountId, setAccountId] = useState<number | null>(resolvedDefaultAccountId);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<ComposerVisibility>('public');
  const [postLanguage, setPostLanguage] = useState('de');
  const [spoilerText, setSpoilerText] = useState('');
  const [title, setTitle] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<ComposerMediaItem[]>([]);

  // Sync accountId when bootstrap data arrives after initial render
  useEffect(() => {
    if (accountId === null && resolvedDefaultAccountId !== null) {
      setAccountId(resolvedDefaultAccountId);
    }
  // resolvedDefaultAccountId is the only trigger needed; accountId is
  // intentionally omitted to avoid overriding the user's manual selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedDefaultAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === accountId) ?? null,
    [accounts, accountId],
  );
  const constraints = getComposerConstraints(selectedAccount);

  const submitMutation = useMutation({
    mutationFn: async (mode: 'schedule' | 'publish') => {
      if (!instanceUrl || !token || !selectedAccount) {
        throw new Error(t('noSessionError'));
      }

      if (!content.trim()) {
        throw new Error(t('emptyContentError'));
      }

      if (constraints.titleRequired && !title.trim()) {
        throw new Error(t('titleRequiredError'));
      }

      if (content.length > constraints.maxCharacters) {
        throw new Error(t('tooLongError', { limit: constraints.maxCharacters }));
      }

      const scheduledAt = mode === 'schedule' ? buildScheduledAt(dateInput, timeInput) : null;
      const formData = buildComposerFormData({
        accountId: selectedAccount.id,
        content,
        visibility,
        language: postLanguage.trim(),
        spoilerText,
        title,
        scheduledAt,
        mediaItems,
      });

      return mode === 'schedule'
        ? createScheduledPost(instanceUrl, token, language, formData)
        : publishPostNow(instanceUrl, token, language, formData);
    },
    onSuccess: async (_, mode) => {
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
      setContent('');
      setSpoilerText('');
      setTitle('');
      setDateInput('');
      setTimeInput('');
      setMediaItems([]);
      setError(null);
      Alert.alert(mode === 'schedule' ? t('scheduledAlert') : t('publishedAlert'));
    },
    onError: async (submitError) => {
      setError(getErrorMessage(submitError, t('composerError')));

      if (isAuthError(submitError) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  const handlePickMedia = async () => {
    if (!selectedAccount) {
      setError(t('pickAccountFirst'));
      return;
    }

    const allowed = getAllowedMediaCount(selectedAccount);
    if (allowed === 0) {
      setError(t('noMediaAllowed'));
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images', 'videos'],
      selectionLimit: allowed,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const nextItems = result.assets.slice(0, allowed).map((asset, index) => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      fileName: asset.fileName ?? `upload-${Date.now()}-${index}`,
      altText: '',
    }));

    setMediaItems(nextItems);
    setError(null);
  };

  return (
    <Screen
      scrollable
      footer={
        <View style={styles.footerActions}>
          <Button
            label={t('publishNow')}
            onPress={() => submitMutation.mutate('publish')}
            loading={submitMutation.isPending}
          />
          <Button
            label={t('schedule')}
            onPress={() => submitMutation.mutate('schedule')}
            loading={submitMutation.isPending}
            variant="secondary"
          />
        </View>
      }
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
        <>
          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('accountTitle')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {accounts.map((account) => (
                  <Chip
                    key={account.id}
                    label={account.display_name || `@${account.username}`}
                    active={accountId === account.id}
                    onPress={() => {
                      setAccountId(account.id);
                      setMediaItems([]);
                      setError(null);
                    }}
                  />
                ))}
              </View>
            </ScrollView>
            {selectedAccount ? (
              <Text style={[styles.helper, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {t('accountHelper', {
                  type: selectedAccount.instance_type,
                  chars: constraints.maxCharacters,
                  media: constraints.allowedMediaCount,
                })}
              </Text>
            ) : null}
          </Card>

          <Card>
            <TextField
              label={t('contentLabel')}
              placeholder={t('contentPlaceholder')}
              multiline
              value={content}
              onChangeText={(value) => {
                setContent(value);
                setError(null);
              }}
              style={[styles.textArea, { textAlignVertical: 'top' }]}
              error={error}
              hint={t('contentHint', { chars: content.length, max: constraints.maxCharacters || 0 })}
            />
            <TextField
              label={t('titleLabel')}
              placeholder={t('titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
            />
            <TextField
              label={t('cwLabel')}
              placeholder={t('cwPlaceholder')}
              value={spoilerText}
              onChangeText={setSpoilerText}
            />
            <TextField
              label={t('languageLabel')}
              placeholder="de"
              value={postLanguage}
              onChangeText={setPostLanguage}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('visibilityTitle')}</Text>
            <View style={styles.filterWrap}>
              {(['public', 'unlisted', 'private', 'direct'] as ComposerVisibility[]).map((option) => (
                <Chip
                  key={option}
                  label={option}
                  active={visibility === option}
                  onPress={() => setVisibility(option)}
                />
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('schedulingTitle')}</Text>
            <TextField
              label={t('dateLabel')}
              placeholder="2026-03-24"
              value={dateInput}
              onChangeText={setDateInput}
            />
            <TextField
              label={t('timeLabel')}
              placeholder="18:30"
              value={timeInput}
              onChangeText={setTimeInput}
              hint={t('timeHint')}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>{t('mediaTitle')}</Text>
            <Button label={t('pickMedia')} onPress={handlePickMedia} variant="secondary" />
            {mediaItems.length === 0 ? (
              <Text style={[styles.helper, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {t('noMedia')}
              </Text>
            ) : (
              mediaItems.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.mediaItem}>
                  <Text style={[styles.mediaName, { color: isDark ? palette.text : palette.lightText }]}>
                    {item.fileName}
                  </Text>
                  <TextField
                    label={t('altTextLabel', { index: index + 1 })}
                    placeholder={t('altTextPlaceholder')}
                    value={item.altText}
                    onChangeText={(value) =>
                      setMediaItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, altText: value } : entry,
                        ),
                      )
                    }
                  />
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function buildComposerFormData(input: {
  accountId: number;
  content: string;
  visibility: ComposerVisibility;
  language: string;
  spoilerText: string;
  title: string;
  scheduledAt: string | null;
  mediaItems: ComposerMediaItem[];
}) {
  const formData = new FormData();
  formData.append('accountId', String(input.accountId));
  formData.append('content', input.content.trim());
  formData.append('visibility', input.visibility);

  if (input.language.trim()) {
    formData.append('language', input.language.trim());
  }

  if (input.spoilerText.trim()) {
    formData.append('spoilerText', input.spoilerText.trim());
  }

  if (input.title.trim()) {
    formData.append('title', input.title.trim());
  }

  if (input.scheduledAt) {
    formData.append('scheduledAt', input.scheduledAt);
  }

  input.mediaItems.forEach((item, index) => {
    formData.append('media', {
      uri: item.uri,
      name: item.fileName,
      type: item.mimeType,
    } as never);

    if (item.altText.trim()) {
      formData.append(`altText_${index}`, item.altText.trim());
    }
  });

  return formData;
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
  helper: {
    fontSize: 13,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textArea: {
    minHeight: 140,
    paddingTop: spacing.md,
  },
  mediaItem: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  mediaName: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerActions: {
    gap: spacing.sm,
  },
});
