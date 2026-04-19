import type { AdminUsersResponse, GlobalNotice } from './types';
import { apiRequest } from './client';

type AdminUsersInput = {
  page: number;
  pageSize: number;
  search?: string;
};

export async function fetchAdminNotice(baseUrl: string, token: string, language: string) {
  return apiRequest<GlobalNotice>({
    baseUrl,
    path: '/api/admin/notice',
    token,
    language,
  });
}

export async function updateAdminNotice(
  baseUrl: string,
  token: string,
  language: string,
  input: GlobalNotice,
) {
  return apiRequest<GlobalNotice>({
    baseUrl,
    path: '/api/admin/notice',
    method: 'PUT',
    token,
    language,
    body: JSON.stringify(input),
  });
}

export async function fetchAdminUsers(baseUrl: string, token: string, language: string, input: AdminUsersInput) {
  const params = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.search?.trim()) {
    params.set('search', input.search.trim());
  }

  return apiRequest<AdminUsersResponse>({
    baseUrl,
    path: `/api/admin/users?${params.toString()}`,
    token,
    language,
  });
}
