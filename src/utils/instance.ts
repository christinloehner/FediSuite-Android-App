type InstanceValidationIssue =
  | 'invalid_url'
  | 'https_required'
  | 'unreachable'
  | 'invalid_server_response'
  | 'no_fedisuite_api'
  | 'tls_issue';

export type InstanceValidationResult =
  | {
      ok: true;
      normalizedUrl: string;
      publicConfig?: {
        enableUserRegistration?: boolean;
      };
      notice?: {
        enabled: boolean;
        markdown: string;
      };
    }
  | {
      ok: false;
      normalizedUrl?: string;
      reason: InstanceValidationIssue;
      message: string;
    };

function tryParseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

export function isLocalDevelopmentUrl(url: string) {
  const parsed = tryParseUrl(url);
  if (!parsed) {
    return false;
  }

  const { hostname, protocol } = parsed;
  if (protocol !== 'http:') {
    return false;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,2})\./);
  if (!match) {
    return false;
  }

  const block = Number(match[1]);
  return block >= 16 && block <= 31;
}

export function normalizeInstanceUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Bitte gib eine FediSuite-Instanz-URL ein.');
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = tryParseUrl(withProtocol);

  if (!parsed || !parsed.hostname) {
    throw new Error('Die Instanz-URL ist ungültig.');
  }

  if (parsed.protocol !== 'https:' && !isLocalDevelopmentUrl(parsed.toString())) {
    throw new Error('HTTP ist nur für lokale Entwicklung oder LAN-Instanzen erlaubt.');
  }

  parsed.pathname = '';
  parsed.search = '';
  parsed.hash = '';

  return parsed.toString().replace(/\/$/, '');
}

async function fetchJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  return { response, payload };
}

export async function validateInstance(input: string): Promise<InstanceValidationResult> {
  let normalizedUrl: string;

  try {
    normalizedUrl = normalizeInstanceUrl(input);
  } catch (error) {
    return {
      ok: false,
      reason: /HTTP/.test((error as Error).message) ? 'https_required' : 'invalid_url',
      message: (error as Error).message,
    };
  }

  try {
    const { response, payload } = await fetchJson(normalizedUrl, '/api/health');

    if (!response.ok) {
      return {
        ok: false,
        normalizedUrl,
        reason: response.status === 503 ? 'invalid_server_response' : 'unreachable',
        message:
          response.status === 503
            ? 'Die Instanz antwortet, aber die Datenbank ist nicht verfügbar.'
            : 'Die Instanz ist erreichbar, liefert aber keine gültige FediSuite-Health-Antwort.',
      };
    }

    if (!payload || payload.status !== 'ok') {
      return {
        ok: false,
        normalizedUrl,
        reason: 'no_fedisuite_api',
        message: 'Unter dieser URL wurde keine kompatible FediSuite-API erkannt.',
      };
    }

    const [configResult, noticeResult] = await Promise.allSettled([
      fetchJson(normalizedUrl, '/api/public/config'),
      fetchJson(normalizedUrl, '/api/public/notice'),
    ]);

    return {
      ok: true,
      normalizedUrl,
      publicConfig:
        configResult.status === 'fulfilled' && configResult.value.response.ok
          ? configResult.value.payload
          : undefined,
      notice:
        noticeResult.status === 'fulfilled' && noticeResult.value.response.ok
          ? noticeResult.value.payload
          : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instanz konnte nicht erreicht werden.';
    return {
      ok: false,
      normalizedUrl,
      reason: /certificate|ssl|tls/i.test(message) ? 'tls_issue' : 'unreachable',
      message: /certificate|ssl|tls/i.test(message)
        ? 'TLS- oder Zertifikatsproblem bei der Instanzverbindung.'
        : 'Die Instanz ist nicht erreichbar oder antwortet nicht.',
    };
  }
}
