import AsyncStorage from '@react-native-async-storage/async-storage';

/** Base URL of the deployed Hangout API. */
export const API_BASE = 'https://hangout-server-neon.vercel.app';

const TOKEN_KEY = 'hangout-api-token';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
  }
}

/** Core request helper: attaches Bearer token, parses JSON, throws ApiError. */
export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const authToken = token !== undefined ? token : await getToken();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError('Network error — check your connection', 0);
  }

  if (!res.ok) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      /* non-JSON error body */
    }
    const msg =
      detail?.message || (typeof detail === 'string' ? detail : `Request failed (${res.status})`);
    throw new ApiError(Array.isArray(msg) ? msg.join(', ') : msg, res.status, detail);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}