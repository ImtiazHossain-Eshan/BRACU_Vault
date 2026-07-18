/** Typed client for the verification + uploads Worker API. Pass a Clerk session
 *  token (from `useAuth().getToken()`); the Worker verifies it server-side. */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function errMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return "Something went wrong. Please try again.";
}

export interface VerifyStatus {
  status: string;
  verified: boolean;
  roles: string[];
  canUpload: boolean;
  email?: string;
}

export interface UploadRecord {
  id: string;
  filename: string;
  size: number;
  status: string;
  course: string | null;
  createdAt: number;
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string })?.error ?? `Request failed (${res.status})`, data);
  }
  return data as T;
}

export const verifyApi = {
  status: (token: string | null) => request<VerifyStatus>("/verify/status", token),
  activate: (token: string | null) => request<VerifyStatus>("/verify/activate", token, { method: "POST" }),
  myUploads: (token: string | null) => request<{ uploads: UploadRecord[] }>("/uploads/mine", token),
};

/** Multipart upload — sent as FormData (do not set Content-Type; the browser
 *  adds the multipart boundary). */
export async function uploadFile(
  token: string | null,
  opts: { file: File; course?: string; category?: string; section?: string },
): Promise<{ ok: boolean; id: string; filename: string; status: string }> {
  const fd = new FormData();
  fd.append("file", opts.file);
  if (opts.course) fd.append("course", opts.course);
  if (opts.category) fd.append("category", opts.category);
  if (opts.section) fd.append("section", opts.section);

  const res = await fetch(`${API_BASE}/api/v1/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string })?.error ?? "Upload failed", data);
  }
  return data as { ok: boolean; id: string; filename: string; status: string };
}

/** A published (approved) student upload, shaped like a VaultResource so the
 *  course browser can merge it straight into its file tree. */
export interface CommunityFile {
  id: string;
  p: string;
  name: string;
  ext: string;
  size: number;
  course: string;
  section: string;
  category: string;
  community: true;
}

/** Public: approved student uploads for a course (no auth). Fails soft to []. */
export async function fetchCourseUploads(course: string): Promise<CommunityFile[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/uploads?course=${encodeURIComponent(course)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { uploads?: CommunityFile[] };
    return data.uploads ?? [];
  } catch {
    return [];
  }
}
