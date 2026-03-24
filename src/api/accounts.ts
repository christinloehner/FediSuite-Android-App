import type { BootstrapAccount } from './types';
import { apiRequest } from './client';

export async function fetchAccounts(baseUrl: string, token: string, language: string) {
  return apiRequest<BootstrapAccount[]>({
    baseUrl,
    path: '/api/accounts',
    token,
    language,
  });
}

export async function disconnectAccount(baseUrl: string, token: string, language: string, accountId: number) {
  return apiRequest<{ success?: boolean; message?: string }>({
    baseUrl,
    path: `/api/accounts/${accountId}`,
    method: 'DELETE',
    token,
    language,
  });
}
