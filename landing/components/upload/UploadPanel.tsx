"use client";

import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useRef, useState } from "react";
import { useVerification } from "@/lib/use-verification";
import { errMessage, uploadFile } from "@/lib/verify-api";

/* The gated upload flow, shared by the Upload button's modal and the /verify
 * page. Three gates: sign in → (auto) verify → upload. */

const Spinner = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-4 py-10 text-fg/50">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
    <p className="text-sm">{label}</p>
  </div>
);

export default function UploadPanel({
  onClose,
  context,
}: {
  onClose?: () => void;
  context?: { course?: string; section?: string };
}) {
  const { isLoaded, isSignedIn, status, loading, error, getToken, refresh } = useVerification();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const [file, setFile] = useState<File | null>(null);
  const [course, setCourse] = useState(context?.course ?? "");
  const [section, setSection] = useState(context?.section ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setUploadErr(null);
    setDone(null);
    try {
      const r = await uploadFile(await getToken(), {
        file,
        course: course.trim() || undefined,
        section: section.trim() || undefined,
      });
      setDone(`Uploaded “${r.filename}”, it's now pending review.`);
      setFile(null);
      setCourse(context?.course ?? "");
      setSection(context?.section ?? "");
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setUploadErr(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <div className="mb-1 flex items-start justify-between gap-3">
      <h2 className="font-display text-2xl font-semibold text-fg">Upload to the Vault</h2>
      {onClose && (
        <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 rounded-lg p-1.5 text-fg/40 transition-colors hover:bg-fg/5 hover:text-fg">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  );

  // 1) Clerk still booting
  if (!isLoaded) return <Card>{header}<Spinner label="Loading…" /></Card>;

  // 2) Signed out → sign in (Clerk allowlist restricts to @g.bracu.ac.bd)
  if (!isSignedIn) {
    return (
      <Card>
        {header}
        <p className="mt-2 text-sm leading-relaxed text-fg/55">
          Uploads are reserved for verified BRAC University students. Sign in with your
          official <span className="font-medium text-accent">@g.bracu.ac.bd</span> account to upload.
        </p>
        <SignInButton mode="modal">
          <button className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2 px-7 py-3.5 text-sm font-semibold text-bg shadow-glow transition-transform active:scale-[0.98]">
            Sign in with university email
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </SignInButton>
        <p className="mt-4 text-center text-xs text-fg/40">No Gmail, Outlook, or temporary email, university accounts only.</p>
      </Card>
    );
  }

  // 3) Signed in, verifying
  if (loading || !status) {
    return (
      <Card>
        {header}
        {error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => void refresh()} className="mt-4 rounded-full border border-fg/15 px-5 py-2 text-sm text-fg/80 hover:bg-fg/5">Try again</button>
          </div>
        ) : (
          <Spinner label="Verifying your university account…" />
        )}
      </Card>
    );
  }

  // 4) Verified → upload
  return (
    <Card>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold leading-tight text-fg">Verified student</h2>
            <p className="text-xs text-fg/45">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <UserButton afterSignOutUrl="/" />
          {onClose && (
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-fg/40 transition-colors hover:bg-fg/5 hover:text-fg">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={onUpload} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-fg/55">File</span>
          <input
            ref={inputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-xl border border-fg/15 bg-fg/[0.03] px-3 py-2.5 text-sm text-fg/80 file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-accent hover:border-accent/40"
          />
        </label>
        {context && (
          <div className="rounded-xl border border-accent/20 bg-accent/[0.06] px-3 py-2 text-xs text-fg/70">
            Uploading to{" "}
            <span className="font-semibold text-accent">
              {[course.trim(), section.trim()].filter(Boolean).join(" › ") || "the Vault"}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-fg/55">Course</span>
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. CSE 260"
              className="w-full rounded-xl border border-fg/15 bg-fg/[0.03] px-4 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg/30 focus:border-accent/60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-fg/55">Folder <span className="text-fg/30">(optional)</span></span>
            <input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Lab / Assignments"
              className="w-full rounded-xl border border-fg/15 bg-fg/[0.03] px-4 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg/30 focus:border-accent/60"
            />
          </label>
        </div>

        {uploadErr && <p className="text-sm text-red-400">{uploadErr}</p>}
        {done && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{done}</p>}

        <button
          type="submit"
          disabled={!file || busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-highlight via-accent to-accent-2 px-7 py-3 text-sm font-semibold text-bg shadow-glow transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/40 border-t-bg" /> Uploading…</> : "Upload file"}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-fg/40">PDF, slides, notebooks, code, images, up to 25 MB. Uploads are reviewed before publishing.</p>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="glass-strong w-full rounded-3xl p-7 shadow-glow">{children}</div>;
}
