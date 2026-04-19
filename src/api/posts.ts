import type { QueuePost } from './types';
import { apiRequest } from './client';

export type UpdatePostInput = {
  content: string;
  title?: string;
  visibility?: string;
  language?: string;
  spoilerText?: string;
  scheduledAt?: string | null;
};

export async function fetchPosts(baseUrl: string, token: string, language: string) {
  const payload = await apiRequest<QueuePost[] | { posts?: QueuePost[]; data?: QueuePost[]; items?: QueuePost[] }>({
    baseUrl,
    path: '/api/posts',
    token,
    language,
  });

  return normalizePostsPayload(payload);
}

export async function deletePost(baseUrl: string, token: string, language: string, postId: number) {
  return apiRequest<{ success?: boolean; message?: string }>({
    baseUrl,
    path: `/api/posts/${postId}`,
    method: 'DELETE',
    token,
    language,
  });
}

export async function repostPost(baseUrl: string, token: string, language: string, postId: number) {
  return apiRequest<{ success?: boolean; message?: string }>({
    baseUrl,
    path: `/api/posts/${postId}/repost`,
    method: 'POST',
    token,
    language,
    body: null,
  });
}

export async function createScheduledPost(baseUrl: string, token: string, language: string, formData: FormData) {
  return apiRequest<{ success?: boolean; post?: QueuePost; message?: string }>({
    baseUrl,
    path: '/api/posts',
    method: 'POST',
    token,
    language,
    body: formData,
  });
}

export async function publishPostNow(baseUrl: string, token: string, language: string, formData: FormData) {
  return apiRequest<{ success?: boolean; post?: QueuePost; message?: string }>({
    baseUrl,
    path: '/api/posts/publish-now',
    method: 'POST',
    token,
    language,
    body: formData,
  });
}

export async function updatePost(
  baseUrl: string,
  token: string,
  language: string,
  postId: number,
  input: UpdatePostInput,
) {
  return apiRequest<{ success?: boolean; post?: QueuePost; message?: string }>({
    baseUrl,
    path: `/api/posts/${postId}`,
    method: 'PUT',
    token,
    language,
    body: JSON.stringify(input),
  });
}

function normalizePostsPayload(payload: QueuePost[] | { posts?: QueuePost[]; data?: QueuePost[]; items?: QueuePost[] }) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.posts)) {
      return payload.posts;
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload.items)) {
      return payload.items;
    }
  }

  return [];
}
