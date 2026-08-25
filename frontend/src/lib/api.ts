/**
 * Client HTTP de l'API NestJS.
 *
 * Toutes les requêtes portent les cookies de session (`credentials: 'include'`).
 * Les erreurs sont normalisées en ApiError, qui expose `fieldErrors` : les pages
 * peuvent ainsi replacer les messages de validation sous les bons champs, sans
 * jamais parser une réponse à la main.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_BASE = `${API_URL}/api`;

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  fieldErrors?: Record<string, string>;
  /** Statut du membre, renvoyé quand une garde de parcours bloque l'accès. */
  memberStatus?: string;
  /** Étape de configuration manquante ('address', 'stripe_connect'). */
  step?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly memberStatus?: string;
  readonly step?: string;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    const message = Array.isArray(body.message)
      ? body.message.join(' ')
      : (body.message ?? 'Une erreur est survenue.');
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = body.fieldErrors ?? {};
    this.memberStatus = body.memberStatus;
    this.step = body.step;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Corps multipart — laisse le navigateur poser le Content-Type et sa boundary. */
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Transmet les cookies côté rendu serveur. */
  headers?: Record<string, string>;
  cache?: RequestCache;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, headers = {}, cache, signal } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      cache: cache ?? 'no-store',
      signal,
      headers: {
        ...(formData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, {
      message:
        'Impossible de joindre le serveur. Vérifie que l’API est démarrée (npm run dev:api).',
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload === 'string' ? { message: payload } : (payload as ApiErrorBody),
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: 'POST', formData }),
};

/** URL de téléchargement direct (bordereaux PDF) — ouverte dans un nouvel onglet. */
export const downloadUrl = (path: string): string =>
  `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
