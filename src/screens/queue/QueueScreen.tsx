import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { deletePost, repostPost, updatePost, type UpdatePostInput } from '../../api/posts';
import type { QueuePost } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorStateView } from '../../components/ErrorStateView';
import { LoadingView } from '../../components/LoadingView';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAuthRecovery } from '../../hooks/useAuthRecovery';
import { usePosts } from '../../hooks/usePosts';
import { useInstanceStore } from '../../store/instanceStore';
import { useSessionStore } from '../../store/sessionStore';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme';
import { getErrorMessage, isAuthError } from '../../utils/error';
import { getMediaCount, getPostStatus, getPostTimestamp, getSpoilerText, stripContent, type QueueFilter } from '../../utils/post';

export function QueueScreen() {
  const isDark = useColorScheme() !== 'light';
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);
  const postsQuery = usePosts();
  const [activeFilter, setActiveFilter] = useSessionStoreLocalFilter();
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const recoverFromAuthFailure = useAuthRecovery();

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      if (!instanceUrl || !token) {
        throw new Error('Keine aktive Sitzung vorhanden.');
      }

      return deletePost(instanceUrl, token, language, postId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
    },
    onError: async (error) => {
      if (isAuthError(error) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  const repostMutation = useMutation({
    mutationFn: async (postId: number) => {
      if (!instanceUrl || !token) {
        throw new Error('Keine aktive Sitzung vorhanden.');
      }

      return repostPost(instanceUrl, token, language, postId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
    },
    onError: async (error) => {
      if (isAuthError(error) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { postId: number; data: UpdatePostInput }) => {
      if (!instanceUrl || !token) {
        throw new Error('Keine aktive Sitzung vorhanden.');
      }

      return updatePost(instanceUrl, token, language, input.postId, input.data);
    },
    onSuccess: async () => {
      setEditingPostId(null);
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['instance', instanceUrl, 'bootstrap'] });
    },
    onError: async (error) => {
      if (isAuthError(error) && instanceUrl) {
        await recoverFromAuthFailure();
      }
    },
  });

  if (postsQuery.isLoading) {
    return (
      <Screen>
        <LoadingView label="Posts werden geladen..." />
      </Screen>
    );
  }

  if (postsQuery.error) {
    if (isAuthError(postsQuery.error) && instanceUrl) {
      void recoverFromAuthFailure();
    }

    return (
      <Screen>
        <ErrorStateView
          title="Queue konnte nicht geladen werden"
          message={getErrorMessage(postsQuery.error)}
          actionLabel="Erneut laden"
          onAction={() => void postsQuery.refetch()}
        />
      </Screen>
    );
  }

  const allPosts = Array.isArray(postsQuery.data) ? postsQuery.data : [];
  const filteredPosts = allPosts.filter((post) => getPostStatus(post) === activeFilter);
  const counts = getCounts(allPosts);

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={postsQuery.isRefetching} onRefresh={() => void postsQuery.refetch()} />}
    >
      <View>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Queue</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Mobile Verwaltung geplanter, fehlgeschlagener, veröffentlichter und gespeicherter Posts
        </Text>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Statusfilter</Text>
        <View style={styles.filterWrap}>
          <Chip label={`Scheduled ${counts.scheduled}`} active={activeFilter === 'scheduled'} onPress={() => setActiveFilter('scheduled')} />
          <Chip label={`Failed ${counts.failed}`} active={activeFilter === 'failed'} onPress={() => setActiveFilter('failed')} />
          <Chip label={`Published ${counts.published}`} active={activeFilter === 'published'} onPress={() => setActiveFilter('published')} />
          <Chip label={`Draft ${counts.draft}`} active={activeFilter === 'draft'} onPress={() => setActiveFilter('draft')} />
        </View>
      </Card>

      {filteredPosts.length === 0 ? (
        <EmptyState
          title={`Keine ${activeFilter}-Posts`}
          description="Für den aktuell gewählten Status hat die Instanz keine Einträge zurückgegeben."
        />
      ) : (
        filteredPosts.map((post) => (
          <QueuePostCard
            key={post.id}
            post={post}
            activeFilter={activeFilter}
            busy={deleteMutation.isPending || repostMutation.isPending || updateMutation.isPending}
            isEditing={editingPostId === post.id}
            onStartEdit={() => setEditingPostId(post.id)}
            onCancelEdit={() => setEditingPostId(null)}
            onSave={(data) => updateMutation.mutate({ postId: post.id, data })}
            onDelete={() => deleteMutation.mutate(post.id)}
            onRepost={() => repostMutation.mutate(post.id)}
          />
        ))
      )}
    </Screen>
  );
}

function QueuePostCard({
  post,
  activeFilter,
  busy,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onRepost,
}: {
  post: QueuePost;
  activeFilter: QueueFilter;
  busy: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: UpdatePostInput) => void;
  onDelete: () => void;
  onRepost: () => void;
}) {
  const isDark = useColorScheme() !== 'light';
  const timestamp = getPostTimestamp(post);
  const [content, setContent] = useState(String(post.content ?? ''));
  const [title, setTitle] = useState(String(post.title ?? ''));
  const [visibility, setVisibility] = useState(String(post.visibility ?? 'public'));
  const [language, setLanguage] = useState(String(post.language ?? ''));
  const [spoilerText, setSpoilerText] = useState(getSpoilerText(post));
  const scheduledSource = String(post.scheduled_at ?? post.scheduledAt ?? '');
  const [scheduledAt, setScheduledAt] = useState(scheduledSource);

  const handleReset = () => {
    setContent(String(post.content ?? ''));
    setTitle(String(post.title ?? ''));
    setVisibility(String(post.visibility ?? 'public'));
    setLanguage(String(post.language ?? ''));
    setSpoilerText(getSpoilerText(post));
    setScheduledAt(String(post.scheduled_at ?? post.scheduledAt ?? ''));
    onCancelEdit();
  };

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={[styles.accountName, { color: isDark ? palette.text : palette.lightText }]}>
          {post.account_username ? `@${post.account_username}` : 'Unbekannter Account'}
        </Text>
        <Text style={[styles.badge, { color: isDark ? palette.accentWarm : palette.accentStrong }]}>
          {activeFilter}
        </Text>
      </View>
      <Text style={[styles.content, { color: isDark ? palette.text : palette.lightText }]}>
        {stripContent(post.content)}
      </Text>
      <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        Sichtbarkeit: {post.visibility ?? 'standard'} | Sprache: {post.language ?? 'unbekannt'} | Medien: {getMediaCount(post)}
      </Text>
      <Text style={[styles.meta, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
        {timestamp ? `Zeitpunkt: ${timestamp}` : 'Kein Zeitpunkt vorhanden'} | Plattform: {post.account_instance_type ?? 'unbekannt'}
      </Text>
      {post.error_message || post.error ? (
        <Text style={styles.errorText}>Fehler: {String(post.error_message ?? post.error)}</Text>
      ) : null}

      {isEditing ? (
        <View style={styles.editForm}>
          <TextField
            label="Inhalt"
            multiline
            value={content}
            onChangeText={setContent}
            style={[styles.textArea, { textAlignVertical: 'top' }]}
          />
          <TextField label="Titel" value={title} onChangeText={setTitle} />
          <TextField label="Sichtbarkeit" value={visibility} onChangeText={setVisibility} />
          <TextField label="Sprache" value={language} onChangeText={setLanguage} />
          <TextField label="Content Warning / Spoiler" value={spoilerText} onChangeText={setSpoilerText} />
          {(activeFilter === 'scheduled' || activeFilter === 'draft' || activeFilter === 'failed') ? (
            <TextField
              label="Geplant für (ISO)"
              value={scheduledAt}
              onChangeText={setScheduledAt}
              hint="Leer lassen oder ISO-Zeit wie 2026-03-24T18:30:00.000Z"
            />
          ) : null}
          <View style={styles.actions}>
            <Button
              label="Speichern"
              onPress={() =>
                onSave({
                  content,
                  title,
                  visibility,
                  language,
                  spoilerText,
                  scheduledAt: scheduledAt.trim() ? scheduledAt.trim() : null,
                })
              }
              disabled={busy}
            />
            <Button label="Abbrechen" onPress={handleReset} variant="secondary" disabled={busy} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Bearbeiten" onPress={onStartEdit} variant="secondary" disabled={busy} />
          <Button label="Löschen" onPress={onDelete} variant="danger" disabled={busy} />
          {(activeFilter === 'failed' || activeFilter === 'draft') ? (
            <Button label="Repost" onPress={onRepost} variant="secondary" disabled={busy} />
          ) : null}
        </View>
      )}
    </Card>
  );
}

function getCounts(posts: QueuePost[]) {
  return {
    scheduled: posts.filter((post) => getPostStatus(post) === 'scheduled').length,
    failed: posts.filter((post) => getPostStatus(post) === 'failed').length,
    published: posts.filter((post) => getPostStatus(post) === 'published').length,
    draft: posts.filter((post) => getPostStatus(post) === 'draft').length,
  };
}

function useSessionStoreLocalFilter(): [QueueFilter, (next: QueueFilter) => void] {
  const filter = useSessionStore((state) => (state.queueFilter as QueueFilter | undefined) ?? 'scheduled');
  const setFilter = useSessionStore((state) => state.setQueueFilter as ((next: QueueFilter) => void) | undefined);

  if (!setFilter) {
    return [filter, () => undefined];
  }

  return [filter, setFilter];
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
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  editForm: {
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
});
