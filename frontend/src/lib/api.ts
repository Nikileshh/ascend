const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  analysisCount: number;
  trialEndsAt: string;
  trialExpired: boolean;
  daysLeft: number;
  premium?: boolean;
  premiumSince?: string;
}

export function getToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("ascend_token");
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ascend_user");
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function setSession(token: string, user: SessionUser) {
  localStorage.setItem("ascend_token", token);
  localStorage.setItem("ascend_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("ascend_token");
  localStorage.removeItem("ascend_user");
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}
