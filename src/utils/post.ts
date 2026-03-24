import type { QueuePost } from '../api/types';

export type QueueFilter = 'scheduled' | 'failed' | 'published' | 'draft';

export function getPostStatus(post: QueuePost): QueueFilter | 'other' {
  const rawStatus = String(post.status ?? '').toLowerCase();

  if (rawStatus.includes('schedule')) {
    return 'scheduled';
  }

  if (rawStatus.includes('fail') || post.failed_at || post.failedAt) {
    return 'failed';
  }

  if (rawStatus.includes('draft')) {
    return 'draft';
  }

  if (rawStatus.includes('publish')) {
    return 'published';
  }

  if (post.published_at || post.publishedAt) {
    return 'published';
  }

  if (post.scheduled_at || post.scheduledAt) {
    return 'scheduled';
  }

  return 'other';
}

export function getPostTimestamp(post: QueuePost) {
  return (
    post.scheduled_at ??
    post.scheduledAt ??
    post.published_at ??
    post.publishedAt ??
    post.created_at ??
    post.createdAt ??
    null
  );
}

export function stripContent(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Ohne Inhalt';
  }

  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getMediaCount(post: QueuePost) {
  const value = post.media_files;

  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean).length;
  }

  return 0;
}

export function getSpoilerText(post: QueuePost) {
  return typeof post.spoiler_text === 'string'
    ? post.spoiler_text
    : typeof post.spoilerText === 'string'
      ? post.spoilerText
      : '';
}
