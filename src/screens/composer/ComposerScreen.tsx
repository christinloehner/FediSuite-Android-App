import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { createScheduledPost, publishPostNow } from '../../api/posts';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { useBootstrap } from '../../hooks/useBootstrap';
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
  const isDark = useColorScheme() !== 'light';
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const bootstrapQuery = useBootstrap();
  const recoverFromAuthFailure = useAuthRecovery();

  const accounts = bootstrapQuery.data?.accounts ?? [];
  const initialAccountId = bootstrapQuery.data?.user.default_account_id ?? accounts[0]?.id ?? null;
  const [accountId, setAccountId] = useState<number | null>(initialAccountId);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<ComposerVisibility>('public');
  const [postLanguage, setPostLanguage] = useState('de');
  const [spoilerText, setSpoilerText] = useState('');
  const [title, setTitle] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<ComposerMediaItem[]>([]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === accountId) ?? null,
    [accounts, accountId],
  );
  const constraints = getComposerConstraints(selectedAccount);

  const submitMutation = useMutation({
    mutationFn: async (mode: 'schedule' | 'publish') => {
      if (!instanceUrl || !token || !selectedAccount) {
        throw new Error('Instanz, Sitzung oder Account fehlen.');
      }

      if (!content.trim()) {
        throw new Error('Der Inhalt des Posts darf nicht leer sein.');
      }

      if (constraints.titleRequired && !title.trim()) {
        throw new Error('Für diesen Account ist ein Titel erforderlich.');
      }

      if (content.length > constraints.maxCharacters) {
        throw new Error(`Der Post überschreitet das Zeichenlimit von ${constraints.maxCharacters}.`);
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
      Alert.alert(mode === 'schedule' ? 'Post eingeplant' : 'Post veröffentlicht');
    },
    onError: async (submitError) => {
      setError(getErrorMessage(submitError, 'Composer-Aktion fehlgeschlagen.'));

      if (isAuthError(submitError) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  const handlePickMedia = async () => {
    if (!selectedAccount) {
      setError('Wähle zuerst einen Account aus.');
      return;
    }

    const allowed = getAllowedMediaCount(selectedAccount);
    if (allowed === 0) {
      setError('Dieser Account erlaubt keine Medien-Uploads.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Zugriff auf die Medienbibliothek wurde nicht erlaubt.');
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
            label="Jetzt veröffentlichen"
            onPress={() => submitMutation.mutate('publish')}
            loading={submitMutation.isPending}
          />
          <Button
            label="Einplanen"
            onPress={() => submitMutation.mutate('schedule')}
            loading={submitMutation.isPending}
            variant="secondary"
          />
        </View>
      }
    >
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Composer</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Schreiben, planen und direkt veröffentlichen
        </Text>
      </View>

      {accounts.length === 0 ? (
        <EmptyState
          title="Keine Accounts verfügbar"
          description="Zum Verfassen eines Posts muss mindestens ein Fediverse-Account verbunden sein."
        />
      ) : (
        <>
          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {accounts.map((account) => (
                  <Chip
                    key={account.id}
                    label={account.display_name || `@${account.username}`}
                    active={accountId === account.id}
                    onPress={() => setAccountId(account.id)}
                  />
                ))}
              </View>
            </ScrollView>
            {selectedAccount ? (
              <Text style={[styles.helper, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                {selectedAccount.instance_type} | max {constraints.maxCharacters} Zeichen | max {constraints.allowedMediaCount} Medien
              </Text>
            ) : null}
          </Card>

          <Card>
            <TextField
              label="Inhalt"
              placeholder="Was möchtest du veröffentlichen?"
              multiline
              value={content}
              onChangeText={(value) => {
                setContent(value);
                setError(null);
              }}
              style={[styles.textArea, { textAlignVertical: 'top' }]}
              error={error}
              hint={`${content.length}/${constraints.maxCharacters || 0} Zeichen`}
            />
            <TextField
              label="Titel"
              placeholder="Optional, bei PeerTube erforderlich"
              value={title}
              onChangeText={setTitle}
            />
            <TextField
              label="Content Warning / Spoiler"
              placeholder="Optional"
              value={spoilerText}
              onChangeText={setSpoilerText}
            />
            <TextField
              label="Sprache"
              placeholder="de"
              value={postLanguage}
              onChangeText={setPostLanguage}
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Sichtbarkeit</Text>
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
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Zeitplanung</Text>
            <TextField
              label="Datum"
              placeholder="2026-03-24"
              value={dateInput}
              onChangeText={setDateInput}
            />
            <TextField
              label="Uhrzeit"
              placeholder="18:30"
              value={timeInput}
              onChangeText={setTimeInput}
              hint="Für 'Einplanen' werden beide Felder benötigt."
            />
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Medien</Text>
            <Button label="Medien auswählen" onPress={handlePickMedia} variant="secondary" />
            {mediaItems.length === 0 ? (
              <Text style={[styles.helper, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
                Noch keine Medien ausgewählt.
              </Text>
            ) : (
              mediaItems.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.mediaItem}>
                  <Text style={[styles.mediaName, { color: isDark ? palette.text : palette.lightText }]}>
                    {item.fileName}
                  </Text>
                  <TextField
                    label={`Alt-Text ${index + 1}`}
                    placeholder="Beschreibe das Medium"
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
