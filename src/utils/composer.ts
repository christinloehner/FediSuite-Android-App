import type { BootstrapAccount } from '../api/types';

export type ComposerVisibility = 'public' | 'unlisted' | 'private' | 'direct';

export type ComposerMediaItem = {
  uri: string;
  mimeType: string;
  fileName: string;
  altText: string;
};

export function getAllowedMediaCount(account: BootstrapAccount | null) {
  if (!account) {
    return 0;
  }

  return Math.min(account.max_media_attachments ?? 0, 4);
}

export function buildScheduledAt(dateInput: string, timeInput: string) {
  const date = dateInput.trim();
  const time = timeInput.trim();

  if (!date && !time) {
    return null;
  }

  if (!date || !time) {
    throw new Error('Für das Planen werden Datum und Uhrzeit benötigt.');
  }

  const iso = `${date}T${time}:00`;
  if (Number.isNaN(Date.parse(iso))) {
    throw new Error('Das geplante Datum oder die Uhrzeit ist ungültig.');
  }

  return new Date(iso).toISOString();
}

export function getComposerConstraints(account: BootstrapAccount | null) {
  if (!account) {
    return {
      maxCharacters: 0,
      allowedMediaCount: 0,
      titleRequired: false,
    };
  }

  const type = account.instance_type.toLowerCase();

  return {
    maxCharacters: account.max_characters,
    allowedMediaCount: getAllowedMediaCount(account),
    titleRequired: type.includes('peertube'),
  };
}
