"use client";

import { SignInButton, useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fileUrl, humanSize } from "@/lib/preview-utils";
import { ApiError, errMessage } from "@/lib/verify-api";
import {
  adminApi,
  type AdminOverview,
  type AdminUser,
  type AuditEntry,
  type QueueItem,
} from "@/lib/admin-api";

type Token = () => Promise<string | null>;
type Tab = "overview" | "moderation" | "files" | "users" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "moderation", label: "Moderation" },
  { id: "files", label: "Files" },
  { id: "users", label: "Users" },
  { id: "audit", label: "Audit log" },
];

const ROLES = ["unverified", "pending", "verified_student", "moderator", "admin", "super_admin"];

function relTime(unixSec: number): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - unixSec);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ───────────────────────────── shell ───────────────────────────── */

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [authState, setAuthState] = useState<"checking" | "ok" | "forbidden" | "signedout">("checking");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return setAuthState("signedout");
    let cancelled = false;
    (async () => {
      try {
        await adminApi.overview(await getToken());
        if (!cancelled) setAuthState("ok");
      } catch (e) {
        if (!cancelled) setAuthState(e instanceof ApiError && (e.status === 403 || e.status === 401) ? "forbidden" : "ok");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || authState === "checking") return <Centered><Spinner /></Centered>;
  if (authState === "signedout")
    return (
      <Centered>
        <Panel>
          <h2 className="font-display text-xl font-semibold text-fg">Admin access</h2>
          <p className="mt-2 text-sm text-fg/55">Sign in with an authorized account to continue.</p>
          <SignInButton mode="modal">
            <button className="mt-5 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2 px-6 py-3 text-sm font-semibold text-bg shadow-glow">Sign in</button>
          </SignInButton>
        </Panel>
      </Centered>
    );
  if (authState === "forbidden")
    return (
      <Centered>
        <Panel>
          <h2 className="font-display text-xl font-semibold text-fg">Not authorized</h2>
          <p className="mt-2 text-sm text-fg/55">Your account doesn&apos;t have admin or moderator permissions.</p>
        </Panel>
      </Centered>
    );

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tightest text-fg">Admin</h1>
        <p className="mt-1 text-sm text-fg/50">Moderation, members & platform health</p>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-fg/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors " +
              (tab === t.id ? "text-fg" : "text-fg/45 hover:text-fg/70")
            }
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab getToken={getToken} />}
        {tab === "moderation" && <ModerationTab getToken={getToken} />}
        {tab === "files" && <FilesTab getToken={getToken} />}
        {tab === "users" && <UsersTab getToken={getToken} />}
        {tab === "audit" && <AuditTab getToken={getToken} />}
      </div>
    </div>
  );
}

/* ───────────────────────────── tabs ───────────────────────────── */

function OverviewTab({ getToken }: { getToken: Token }) {
  const [ov, setOv] = useState<AdminOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        setOv(await adminApi.overview(await getToken()));
      } catch (e) {
        setErr(errMessage(e));
      }
    })();
  }, [getToken]);

  const stats: { key: keyof AdminOverview; label: string }[] = [
    { key: "totalUsers", label: "Total users" },
    { key: "verifiedUsers", label: "Verified students" },
    { key: "pendingUploads", label: "Pending review" },
    { key: "totalUploads", label: "Total uploads" },
  ];

  if (err) return <ErrorNote msg={err} />;
  if (!ov) return <Spinner />;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.key} className="glass rounded-2xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-fg/40">{s.label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-fg">{ov[s.key]}</p>
        </div>
      ))}
    </div>
  );
}

function ModerationTab({ getToken }: { getToken: Token }) {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi.queue(await getToken());
      setQueue(r.uploads);
      setHasMore(r.hasMore);
    } catch (e) {
      setErr(errMessage(e));
    }
  }, [getToken]);
  useEffect(() => void load(), [load]);

  async function loadMore() {
    setMore(true);
    try {
      const r = await adminApi.queue(await getToken(), "pending", queue?.length ?? 0);
      setQueue((q) => {
        const seen = new Set((q ?? []).map((x) => x.id));
        return [...(q ?? []), ...r.uploads.filter((u) => !seen.has(u.id))];
      });
      setHasMore(r.hasMore);
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setMore(false);
    }
  }

  async function moderate(item: QueueItem, action: "approve" | "reject") {
    setActing(item.id);
    try {
      await adminApi.moderate(await getToken(), item.id, action);
      setQueue((q) => (q ?? []).filter((u) => u.id !== item.id));
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setActing(null);
    }
  }

  async function view(item: QueueItem) {
    setActing(item.id);
    try {
      const blob = await adminApi.fileBlob(await getToken(), item.id);
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setActing(null);
    }
  }

  if (err) return <ErrorNote msg={err} />;
  if (!queue) return <Spinner />;
  if (queue.length === 0) return <Empty msg="Nothing pending. The queue is clear. ✨" />;

  return (
    <div>
    <Table head={["File", "Uploader", "Course", "Size", ""]}>
      {queue.map((u) => (
        <tr key={u.id} className="border-b border-fg/5 last:border-0">
          <td className="px-5 py-3">
            <div className="max-w-[16rem] truncate font-medium text-fg">{u.filename}</div>
            <div className="text-xs text-fg/40">{relTime(u.createdAt)}</div>
          </td>
          <td className="hidden px-3 py-3 text-fg/60 sm:table-cell">{u.uploaderEmail}</td>
          <td className="hidden px-3 py-3 text-fg/60 md:table-cell">{u.course ?? "-"}</td>
          <td className="hidden px-3 py-3 text-fg/60 md:table-cell">{humanSize(u.size)}</td>
          <td className="px-5 py-3">
            <div className="flex justify-end gap-2">
              <button disabled={acting === u.id} onClick={() => void view(u)} className="rounded-lg bg-fg/10 px-3 py-1.5 text-xs font-semibold text-fg/70 hover:bg-fg/15 disabled:opacity-40">View</button>
              <button disabled={acting === u.id} onClick={() => void moderate(u, "approve")} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40">Approve</button>
              <button disabled={acting === u.id} onClick={() => void moderate(u, "reject")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40">Reject</button>
            </div>
          </td>
        </tr>
      ))}
    </Table>
    {hasMore && <LoadMore onClick={() => void loadMore()} busy={more} />}
    </div>
  );
}

type FileItem = {
  key: string;
  source: "archive" | "upload";
  p?: string;
  id?: string;
  name: string;
  course: string;
  section: string;
  size: number;
  status?: string;
  hidden?: boolean;
};

function FilesTab({ getToken }: { getToken: Token }) {
  const [items, setItems] = useState<FileItem[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", course: "", section: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const token = await getToken();
      const [{ allResources }, filesRes, ovRes] = await Promise.all([
        import("@/lib/resources"),
        adminApi.files(token),
        adminApi.overrides(token),
      ]);
      const ov = new Map(ovRes.overrides.map((o) => [o.p, o]));
      const archive: FileItem[] = allResources.map((f) => {
        const o = ov.get(f.p);
        return {
          key: "a:" + f.p,
          source: "archive",
          p: f.p,
          name: o?.name ?? f.name,
          course: o?.course ?? f.course,
          section: o?.section ?? f.section,
          size: o?.size ?? f.size,
          hidden: o?.hidden ?? false,
        };
      });
      const uploads: FileItem[] = filesRes.uploads.map((u) => ({
        key: "u:" + u.id,
        source: "upload",
        id: u.id,
        name: u.filename,
        course: u.course ?? "",
        section: u.section ?? "",
        size: u.size,
        status: u.status,
      }));
      setItems([...uploads, ...archive]);
    } catch (e) {
      setErr(errMessage(e));
    }
  }, [getToken]);
  useEffect(() => void load(), [load]);

  const [visible, setVisible] = useState(120);
  const matched = useMemo(() => {
    if (!items) return [];
    const ql = q.trim().toLowerCase();
    return ql
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(ql) ||
            i.course.toLowerCase().includes(ql) ||
            i.section.toLowerCase().includes(ql),
        )
      : items;
  }, [items, q]);
  const filtered = matched.slice(0, visible);

  function startEdit(i: FileItem) {
    setEditing(i.key);
    setDraft({ name: i.name, course: i.course, section: i.section });
  }
  async function saveEdit(i: FileItem) {
    setBusy(i.key);
    setErr(null);
    try {
      const token = await getToken();
      if (i.source === "upload")
        await adminApi.editUpload(token, i.id!, { filename: draft.name, course: draft.course, section: draft.section });
      else
        await adminApi.setOverride(token, { p: i.p!, name: draft.name, course: draft.course, section: draft.section, size: i.size });
      setItems((list) => (list ?? []).map((x) => (x.key === i.key ? { ...x, ...draft } : x)));
      setEditing(null);
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(null);
    }
  }
  async function remove(i: FileItem) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${i.name}"? It will be removed from the vault.`)) return;
    setBusy(i.key);
    setErr(null);
    try {
      const token = await getToken();
      if (i.source === "upload") {
        await adminApi.deleteUpload(token, i.id!);
        setItems((list) => (list ?? []).filter((x) => x.key !== i.key));
      } else {
        await adminApi.setOverride(token, { p: i.p!, hidden: true });
        setItems((list) => (list ?? []).map((x) => (x.key === i.key ? { ...x, hidden: true } : x)));
      }
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(null);
    }
  }
  async function restore(i: FileItem) {
    setBusy(i.key);
    try {
      const token = await getToken();
      await adminApi.setOverride(token, { p: i.p!, hidden: false });
      setItems((list) => (list ?? []).map((x) => (x.key === i.key ? { ...x, hidden: false } : x)));
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(null);
    }
  }
  async function viewFile(i: FileItem) {
    if (i.source === "archive") {
      window.open(fileUrl(i.p!), "_blank", "noopener");
      return;
    }
    setBusy(i.key);
    try {
      const blob = await adminApi.fileBlob(await getToken(), i.id!);
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (err && !items) return <ErrorNote msg={err} />;
  if (!items) return <Spinner />;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setVisible(120);
        }}
        placeholder="Search files by name, course or folder…"
        className="mb-3 w-full max-w-md rounded-xl border border-fg/15 bg-fg/[0.03] px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg/30 focus:border-accent/60"
      />
      {err && <ErrorNote msg={err} />}
      <p className="mb-2 text-xs text-fg/40">
        {filtered.length} shown of {matched.length} matching ({items.length} total).
      </p>
      <Table head={["File", "Type", "Course", "Folder", ""]}>
        {filtered.map((i) =>
          editing === i.key ? (
            <tr key={i.key} className="border-b border-fg/5 bg-fg/[0.03]">
              <td className="px-5 py-3">
                <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="w-full rounded-lg border border-fg/15 bg-bg-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent/60" />
              </td>
              <td className="px-3 py-3 text-xs text-fg/40">{i.source}</td>
              <td className="px-3 py-3">
                <input value={draft.course} onChange={(e) => setDraft((d) => ({ ...d, course: e.target.value }))} placeholder="CSE 260" className="w-24 rounded-lg border border-fg/15 bg-bg-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent/60" />
              </td>
              <td className="px-3 py-3">
                <input value={draft.section} onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))} placeholder="Lab / Assignments" className="w-40 rounded-lg border border-fg/15 bg-bg-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent/60" />
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <button disabled={busy === i.key} onClick={() => void saveEdit(i)} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40">Save</button>
                  <button onClick={() => setEditing(null)} className="rounded-lg bg-fg/10 px-3 py-1.5 text-xs font-semibold text-fg/70 hover:bg-fg/15">Cancel</button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={i.key} className={"border-b border-fg/5 last:border-0 " + (i.hidden ? "opacity-40" : "")}>
              <td className="px-5 py-3">
                <div className="max-w-[18rem] truncate font-medium text-fg">{i.name}</div>
                <div className="text-xs text-fg/40">
                  {humanSize(i.size)}
                  {i.status && i.status !== "approved" ? ` · ${i.status}` : ""}
                  {i.hidden ? " · hidden" : ""}
                </div>
              </td>
              <td className="hidden px-3 py-3 sm:table-cell">
                <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + (i.source === "upload" ? "bg-emerald-500/15 text-emerald-400" : "bg-fg/10 text-fg/50")}>
                  {i.source === "upload" ? "Student" : "Archive"}
                </span>
              </td>
              <td className="hidden px-3 py-3 text-fg/60 md:table-cell">{i.course || "-"}</td>
              <td className="hidden px-3 py-3 text-fg/50 md:table-cell">{i.section || "-"}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <button disabled={busy === i.key} onClick={() => void viewFile(i)} className="rounded-lg bg-fg/10 px-3 py-1.5 text-xs font-semibold text-fg/70 hover:bg-fg/15 disabled:opacity-40">View</button>
                  <button disabled={busy === i.key} onClick={() => startEdit(i)} className="rounded-lg bg-fg/10 px-3 py-1.5 text-xs font-semibold text-fg/70 hover:bg-fg/15 disabled:opacity-40">Edit</button>
                  {i.hidden ? (
                    <button disabled={busy === i.key} onClick={() => void restore(i)} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40">Restore</button>
                  ) : (
                    <button disabled={busy === i.key} onClick={() => void remove(i)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40">Delete</button>
                  )}
                </div>
              </td>
            </tr>
          ),
        )}
      </Table>
      {matched.length > visible && (
        <LoadMore onClick={() => setVisible((v) => v + 120)} />
      )}
    </div>
  );
}

function UsersTab({ getToken }: { getToken: Token }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [more, setMore] = useState(false);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi.users(await getToken(), q);
      setUsers(r.users);
      setHasMore(r.hasMore);
    } catch (e) {
      setErr(errMessage(e));
    }
  }, [getToken, q]);
  useEffect(() => void load(), [load]);

  async function loadMore() {
    setMore(true);
    try {
      const r = await adminApi.users(await getToken(), q, "all", users?.length ?? 0);
      setUsers((list) => {
        const seen = new Set((list ?? []).map((x) => x.id));
        return [...(list ?? []), ...r.users.filter((u) => !seen.has(u.id))];
      });
      setHasMore(r.hasMore);
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setMore(false);
    }
  }

  async function changeRole(u: AdminUser, role: string) {
    setBusy(u.id);
    setErr(null);
    try {
      await adminApi.setUserRole(await getToken(), u.id, role);
      setUsers((list) => (list ?? []).map((x) => (x.id === u.id ? { ...x, roles: [role] } : x)));
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(u: AdminUser, status: string) {
    setBusy(u.id);
    setErr(null);
    try {
      await adminApi.setUserStatus(await getToken(), u.id, status);
      setUsers((list) => (list ?? []).map((x) => (x.id === u.id ? { ...x, status } : x)));
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email…"
        className="mb-3 w-full max-w-xs rounded-xl border border-fg/15 bg-fg/[0.03] px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg/30 focus:border-accent/60"
      />
      {err && <ErrorNote msg={err} />}
      {!users ? (
        <Spinner />
      ) : users.length === 0 ? (
        <Empty msg="No users found." />
      ) : (
        <>
        <Table head={["User", "Status", "Role", "Joined", ""]}>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-fg/5 last:border-0">
              <td className="max-w-[16rem] truncate px-5 py-3 font-medium text-fg">{u.email}</td>
              <td className="px-3 py-3"><StatusPill status={u.status} /></td>
              <td className="px-3 py-3">
                <select
                  value={u.roles[0] ?? "unverified"}
                  disabled={busy === u.id}
                  onChange={(e) => void changeRole(u, e.target.value)}
                  className="rounded-lg border border-fg/15 bg-bg-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent/60 disabled:opacity-40"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td className="hidden px-3 py-3 text-fg/50 md:table-cell">{relTime(u.createdAt)}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  {u.status === "suspended" || u.status === "banned" ? (
                    <button disabled={busy === u.id} onClick={() => void changeStatus(u, "verified")} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40">Restore</button>
                  ) : (
                    <>
                      <button disabled={busy === u.id} onClick={() => void changeStatus(u, "suspended")} className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-40">Suspend</button>
                      <button disabled={busy === u.id} onClick={() => void changeStatus(u, "banned")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40">Ban</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {hasMore && <LoadMore onClick={() => void loadMore()} busy={more} />}
        </>
      )}
    </div>
  );
}

function AuditTab({ getToken }: { getToken: Token }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi.audit(await getToken());
      setEntries(r.entries);
      setHasMore(r.hasMore);
    } catch (e) {
      setErr(errMessage(e));
    }
  }, [getToken]);
  useEffect(() => void load(), [load]);

  async function loadMore() {
    setMore(true);
    try {
      const r = await adminApi.audit(await getToken(), entries?.length ?? 0);
      setEntries((list) => {
        const seen = new Set((list ?? []).map((x) => x.id));
        return [...(list ?? []), ...r.entries.filter((e) => !seen.has(e.id))];
      });
      setHasMore(r.hasMore);
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setMore(false);
    }
  }

  if (err) return <ErrorNote msg={err} />;
  if (!entries) return <Spinner />;
  if (entries.length === 0) return <Empty msg="No audit entries yet." />;
  return (
    <div>
    <Table head={["Action", "Actor", "Entity", "When"]}>
      {entries.map((e) => (
        <tr key={e.id} className="border-b border-fg/5 last:border-0">
          <td className="px-5 py-3"><code className="rounded bg-fg/5 px-1.5 py-0.5 text-xs text-accent">{e.action}</code></td>
          <td className="px-3 py-3 text-fg/60">{e.actorEmail ?? "system"}</td>
          <td className="hidden px-3 py-3 text-fg/45 sm:table-cell">{e.entityType ?? "-"}</td>
          <td className="px-5 py-3 text-fg/45">{relTime(e.createdAt)}</td>
        </tr>
      ))}
    </Table>
    {hasMore && <LoadMore onClick={() => void loadMore()} busy={more} />}
    </div>
  );
}

/* ───────────────────────────── ui bits ───────────────────────────── */

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-[60vh] items-center justify-center">{children}</div>
);
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center shadow-glow">{children}</div>
);
const Spinner = () => (
  <div className="flex justify-center py-10"><span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" /></div>
);
const ErrorNote = ({ msg }: { msg: string }) => (
  <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{msg}</p>
);
const Empty = ({ msg }: { msg: string }) => (
  <div className="glass rounded-2xl px-5 py-12 text-center text-sm text-fg/45">{msg}</div>
);
const LoadMore = ({ onClick, busy }: { onClick: () => void; busy?: boolean }) => (
  <div className="mt-3 flex justify-center">
    <button
      disabled={busy}
      onClick={onClick}
      className="rounded-full glass px-5 py-2 text-sm text-fg/70 transition-colors hover:text-fg disabled:opacity-40"
    >
      {busy ? "Loading…" : "Load more"}
    </button>
  </div>
);
const Table = ({ head, children }: { head: string[]; children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-2xl glass">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-fg/10 text-left text-xs uppercase tracking-wide text-fg/40">
          {head.map((h, i) => (
            <th key={i} className={"px-3 py-3 font-medium " + (i === 0 ? "pl-5" : "") + (i === head.length - 1 ? " pr-5 text-right" : "")}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "verified" ? "bg-emerald-500/15 text-emerald-400"
    : status === "suspended" ? "bg-amber-500/15 text-amber-400"
    : status === "banned" ? "bg-red-500/15 text-red-400"
    : "bg-fg/10 text-fg/60";
  return <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + tone}>{status}</span>;
}
