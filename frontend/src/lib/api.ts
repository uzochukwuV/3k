type ApiError = Error & { status?: number; data?: unknown };

const baseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";

export async function apiRequest<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text.length > 0 ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error((data && (data.error as string)) || `Request failed (${res.status})`) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

