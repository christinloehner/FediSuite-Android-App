import { ApiError } from '../utils/error';

type RequestOptions = {
  baseUrl: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string | null;
  language?: string;
  body?: BodyInit | string | null;
  headers?: Record<string, string>;
};

export async function apiRequest<T>({
  baseUrl,
  path,
  method = 'GET',
  token,
  language = 'de',
  body,
  headers,
}: RequestOptions): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(language ? { 'Accept-Language': language } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  });

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status);
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message;
    }

    if ('error' in payload && typeof payload.error === 'string') {
      return payload.error;
    }
  }

  switch (status) {
    case 400:
      return 'Ungültige Anfrage an die FediSuite-API.';
    case 401:
      return 'Die Sitzung ist nicht mehr gültig.';
    case 403:
      return 'Der Zugriff wurde von der Instanz abgelehnt.';
    case 404:
      return 'Die angeforderte Ressource wurde auf der Instanz nicht gefunden.';
    case 429:
      return 'Die Instanz begrenzt gerade die Anfragen. Bitte später erneut versuchen.';
    default:
      return 'Die FediSuite-API hat einen Fehler zurückgegeben.';
  }
}
