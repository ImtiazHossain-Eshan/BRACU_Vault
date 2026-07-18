import { ApiError } from "./verify-api";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

async function req<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string })?.error ?? `Request failed (${res.status})`, data);
  return data as T;
}

export interface AdminOverview {
  totalUsers: number;
  verifiedUsers: number;
  pendingUploads: number;
  totalUploads: number;
}

export interface QueueItem {
  id: string;
  filename: string;
  size: number;
  course: string | null;
  status: string;
  createdAt: number;
  uploaderEmail: string;
}

export interface AdminUser {
  id: string;
  email: string;
  status: string;
  createdAt: number;
  roles: string[];
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: number;
  actorEmail: string | null;
}

export interface AdminFile {
  id: string;
  filename: string;
  size: number;
  course: string | null;
  section: string | null;
  status: string;
  publicKey: string | null;
  createdAt: number;
  uploaderEmail: string;
}

export interface FileOverrideRow {
  p: string;
  hidden: boolean;
  name: string | null;
  course: string | null;
  section: string | null;
  size: number | null;
}

export const adminApi = {
  overview: (token: string | null) => req<AdminOverview>("/admin/overview", token),
  queue: (token: string | null, status = "pending", offset = 0, limit = 30) =>
    req<{ uploads: QueueItem[]; hasMore: boolean }>(
      `/admin/uploads?status=${encodeURIComponent(status)}&limit=${limit}&offset=${offset}`,
      token,
    ),
  moderate: (token: string | null, id: string, action: "approve" | "reject") =>
    req<{ ok: boolean; id: string; status: string }>(`/admin/uploads/${id}/${action}`, token, { method: "POST" }),
  users: (token: string | null, q = "", status = "all", offset = 0, limit = 50) =>
    req<{ users: AdminUser[]; hasMore: boolean }>(
      `/admin/users?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&limit=${limit}&offset=${offset}`,
      token,
    ),
  setUserRole: (token: string | null, id: string, role: string) =>
    req<{ ok: boolean }>(`/admin/users/${id}/role`, token, { method: "POST", body: JSON.stringify({ role }) }),
  setUserStatus: (token: string | null, id: string, status: string) =>
    req<{ ok: boolean }>(`/admin/users/${id}/status`, token, { method: "POST", body: JSON.stringify({ status }) }),
  audit: (token: string | null, offset = 0, limit = 50) =>
    req<{ entries: AuditEntry[]; hasMore: boolean }>(`/admin/audit?limit=${limit}&offset=${offset}`, token),
  files: (token: string | null) => req<{ uploads: AdminFile[] }>("/admin/files", token),
  overrides: (token: string | null) => req<{ overrides: FileOverrideRow[] }>("/catalog/overrides", token),
  deleteUpload: (token: string | null, id: string) =>
    req<{ ok: boolean }>(`/admin/uploads/${id}/delete`, token, { method: "POST" }),
  editUpload: (
    token: string | null,
    id: string,
    meta: { course?: string | null; section?: string | null; filename?: string },
  ) => req<{ ok: boolean }>(`/admin/uploads/${id}`, token, { method: "POST", body: JSON.stringify(meta) }),
  setOverride: (
    token: string | null,
    body: { p: string; hidden?: boolean; name?: string | null; course?: string | null; section?: string | null; size?: number | null },
  ) => req<{ ok: boolean }>("/admin/files/override", token, { method: "POST", body: JSON.stringify(body) }),
  /** Fetch an upload's bytes (moderation preview). Returns a Blob typed by the server. */
  fileBlob: async (token: string | null, id: string): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/api/v1/admin/uploads/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, "Couldn't load the file.");
    return res.blob();
  },
};

