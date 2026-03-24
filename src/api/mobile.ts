import type { AccountDashboardResponse, BootstrapResponse, MobilePreferencesResponse } from './types';
import { apiRequest } from './client';

export async function fetchBootstrap(baseUrl: string, token: string, language: string) {
  return apiRequest<BootstrapResponse>({
    baseUrl,
    path: '/api/mobile/bootstrap',
    token,
    language,
  });
}

export async function updatePreferences(
  baseUrl: string,
  token: string,
  language: string,
  input: {
    theme?: string;
    timezone?: string;
    defaultAccountId?: number;
    language?: string;
  },
) {
  return apiRequest<MobilePreferencesResponse>({
    baseUrl,
    path: '/api/mobile/preferences',
    method: 'PUT',
    token,
    language,
    body: JSON.stringify(input),
  });
}

export async function fetchAccountDashboard(
  baseUrl: string,
  token: string,
  language: string,
  input: {
    accountId: number;
    days: number;
    topPostsSort?: string;
    topHashtagsSort?: string;
  },
) {
  const params = new URLSearchParams({
    days: String(input.days),
  });

  if (input.topPostsSort) {
    params.set('topPostsSort', input.topPostsSort);
  }

  if (input.topHashtagsSort) {
    params.set('topHashtagsSort', input.topHashtagsSort);
  }

  return apiRequest<AccountDashboardResponse>({
    baseUrl,
    path: `/api/mobile/accounts/${input.accountId}/dashboard?${params.toString()}`,
    token,
    language,
  });
}
