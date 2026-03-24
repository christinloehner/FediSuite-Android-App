import type { LoginResponse } from './types';
import { apiRequest } from './client';

export async function loginWithPassword(baseUrl: string, identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();

  return apiRequest<LoginResponse>({
    baseUrl,
    path: '/api/auth/login',
    method: 'POST',
    language: 'de',
    body: JSON.stringify({
      identifier: normalizedIdentifier,
      password,
    }),
  });
}
