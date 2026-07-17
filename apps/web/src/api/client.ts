const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API ${status}`);
    this.name = "ApiError";
  }
}

/** Narrows an unknown ApiError body to its `error` string, if present. */
export function extractApiMessage(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const body = err.body;
  if (typeof body === "object" && body !== null && "error" in body) {
    const { error } = body as { error: unknown };
    if (typeof error === "string") return error;
  }
  return null;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
