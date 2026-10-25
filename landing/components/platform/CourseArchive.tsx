"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories } from "@/lib/data";
import { humanSize, type VaultResource } from "@/lib/preview-utils";
import { usePreview } from "@/components/preview/PreviewProvider";
import { useVaultStore } from "@/store/useVaultStore";
import { cn } from "@/lib/cn";
import { fetchCourseUploads } from "@/lib/verify-api";
import { fetchOverrides, applyOverrides, injectedForCourse, type FileOverride } from "@/lib/overrides";
import UploadButton from "@/components/upload/UploadButton";

/* ----------------------------- tree model ------------------------------ */
interface FolderNode {
  name: string;
  files: VaultResource[];
  children: Record<string, FolderNode>;
}

function buildTree(files: VaultResource[], isMultiLang?: boolean): FolderNode {
  const root: FolderNode = { name: "root", files: [], children: {} };
  if (isMultiLang) {
    root.children["Python"] = { name: "Python", files: [], children: {} };
    root.children["Java"] = {
      name: "Java",
      files: [],
      children: {
        Lab: { name: "Lab", files: [], children: {} },
        Theory: { name: "Theory", files: [], children: {} },
      },
    };
  }
  for (const f of files) {
    // section is the folder chain between the course and the file (from the scan).
    const chain = f.section ? f.section.split(" / ").filter(Boolean) : [];
    let node = root;
    for (const part of chain) {
      node.children[part] ||= { name: part, files: [], children: {} };
      node = node.children[part];
    }
    node.files.push(f);
  }
  return root;
}

const childFolders = (n: FolderNode) =>
  Object.values(n.children).sort((a, b) => a.name.localeCompare(b.name));
const countFiles = (n: FolderNode): number =>
  n.files.length + Object.values(n.children).reduce((a, c) => a + countFiles(c), 0);
const nodeAt = (root: FolderNode, section: string, path: string[]) => {
  let n: FolderNode | undefined = root.children[section];
  for (const p of path) n = n?.children[p];
  return n ?? null;
};
const isKeyFolder = (name: string) => /question|previous|past|solution/i.test(name);

/* ------------------------------- icons --------------------------------- */
function Folder({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** Courses whose vault folders are split into Python / Java. */
const MULTI_LANG_COURSES = new Set(["CSE110", "CSE111", "CSE220", "CSE221"]);
const isLang = (name: string) => /^(python|java)$/i.test(name.trim());

const LANG_META: Record<string, { color: string; glow: string; desc: string }> = {
  python: {
    color: "#3776AB",
    glow: "rgba(55, 118, 171, 0.45)",
    desc: "Python implementation — notes, labs, assignments and solutions",
  },
  java: {
    color: "#E76F00",
    glow: "rgba(231, 111, 0, 0.45)",
    desc: "Java implementation — notes, labs, assignments and solutions",
  },
};

function SectionGlyph({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n === "python")
    return (
      <img
        src="/icons/python.png"
        alt="Python"
        className={cn("inline-block object-contain", className)}
      />
    );
  if (n === "java")
    return (
      <img
        src="/icons/java.png"
        alt="Java"
        className={cn("inline-block object-contain", className)}
      />
    );
  if (n.includes("lab"))
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  if (n.includes("theory"))
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M18 17H6a2 2 0 0 0-2 2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  if (n.includes("resource") || n.includes("extra"))
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M3 12l9 4.5L21 12M3 16.5 12 21l9-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  return <Folder className={className} />;
}

/* ---------------------------- file row --------------------------------- */
function FileRow({
  f,
  onOpen,
  delay = 0,
}: {
  f: VaultResource;
  onOpen: (f: VaultResource) => void;
  delay?: number;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, delay }}
      whileHover={{ y: -2 }}
      onClick={() => onOpen(f)}
      className="group flex items-center gap-3 rounded-xl glass px-3 py-2.5 text-left transition-shadow hover:shadow-glow"
    >
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-accent/[0.14] text-[9px] font-bold uppercase text-accent">
        {f.ext}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{f.name}</span>
        <span className="block text-xs text-fg/40">{humanSize(f.size)}</span>
      </span>
      {f.community && (
        <span className="flex-shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          Student
        </span>
      )}
    </motion.button>
  );
}

/* ---------------------------- tree node -------------------------------- */
function TreeNode({
  node,
  section,
  path,
  activePath,
  expanded,
  onSelect,
  onToggle,
  depth,
}: {
  node: FolderNode;
  section: string;
  path: string[];
  activePath: string[];
  expanded: Set<string>;
  onSelect: (p: string[]) => void;
  onToggle: (key: string) => void;
  depth: number;
}) {
  const key = `${section}/${path.join("/")}`;
  const open = expanded.has(key);
  const active = activePath.join("/") === path.join("/");
  const folders = childFolders(node);
  const hasChildren = folders.length > 0;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          onSelect(path);
          if (hasChildren && !open) onToggle(key);
        }}
        onKeyDown={(e) => e.key === "Enter" && onSelect(path)}
        className={cn(
          "group flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition-colors",
          active ? "bg-fg/[0.08] text-fg" : "text-fg/55 hover:bg-fg/[0.04] hover:text-fg"
        )}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        <span
          className="grid w-4 place-items-center text-fg/40"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(key);
          }}
        >
          {hasChildren && <Chevron open={open} />}
        </span>
        <Folder className="h-4 w-4 flex-shrink-0 opacity-70" />
        <span className="flex-1 truncate">{node.name}</span>
        {isKeyFolder(node.name) && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent" title="Key folder" />
        )}
        <span className="text-xs text-fg/30">{countFiles(node)}</span>
      </div>
      <AnimatePresence initial={false}>
        {open && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            {folders.map((c) => (
              <TreeNode
                key={c.name}
                node={c}
                section={section}
                path={[...path, c.name]}
                activePath={activePath}
                expanded={expanded}
                onSelect={onSelect}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================== main =================================== */
export default function CourseArchive({
  code,
  title,
  category,
  files,
}: {
  code: string;
  title: string;
  category: string;
  files: VaultResource[];
}) {
  const { open } = usePreview();
  const addRecent = useVaultStore((s) => s.addRecentCourse);
  useEffect(() => {
    addRecent(code);
  }, [code, addRecent]);

  // Approved student uploads for this course, merged into the same tree so they
  // appear inside their target folder (badged) alongside the official archive.
  const [community, setCommunity] = useState<VaultResource[]>([]);
  const [overrides, setOverrides] = useState<FileOverride[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchCourseUploads(code).then((rows) => {
      if (!cancelled) setCommunity(rows);
    });
    fetchOverrides().then((o) => {
      if (!cancelled) setOverrides(o);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const cat = categories.find((c) => c.id === category);
  const allFiles = useMemo(() => {
    const base = applyOverrides(files, overrides, code);
    const injected = injectedForCourse(code, overrides, new Set(files.map((f) => f.p)));
    return [...base, ...injected, ...community];
  }, [files, community, overrides, code]);
  const isMultiLang = MULTI_LANG_COURSES.has(code.replace(/\s+/g, ""));
  const root = useMemo(() => buildTree(allFiles, isMultiLang), [allFiles, isMultiLang]);
  const sections = useMemo(() => childFolders(root), [root]);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<VaultResource[]>([]);

  const activeLangMeta = section ? LANG_META[section.toLowerCase()] : null;

  function openFile(f: VaultResource) {
    setRecent((prev) => [f, ...prev.filter((x) => x.p !== f.p)].slice(0, 6));
    open(f);
  }

  function enterSection(name: string) {
    setSection(name);
    setPath([]);
    setExpanded(new Set([`${name}/`]));
  }

  function select(p: string[]) {
    setPath(p);
    setExpanded((prev) => {
      const n = new Set(prev);
      for (let i = 0; i <= p.length; i++) n.add(`${section}/${p.slice(0, i).join("/")}`);
      return n;
    });
  }

  function toggle(key: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  const current = section ? nodeAt(root, section, path) : null;
  const currentSection = section ? [section, ...path].join(" / ") : "";

  // contextual search across the whole course
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allFiles.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 60);
  }, [query, allFiles]);

  const view = query ? "search" : section ? "explorer" : "home";

  return (
    <section className="relative mx-auto max-w-content px-5 pb-28 pt-28 sm:px-8 sm:pt-32">
      {/* breadcrumb + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-fg/50">
          <Link href="/orbit" className="transition-colors hover:text-fg">
            Orbit
          </Link>
          <span className="text-fg/20">/</span>
          <button
            onClick={() => {
              setSection(null);
              setPath([]);
              setQuery("");
            }}
            className={cn("transition-colors hover:text-fg", !section && "font-semibold text-fg")}
          >
            {code}
          </button>
          {section && (
            <>
              <span className="text-fg/20">/</span>
              <button onClick={() => select([])} className="transition-colors hover:text-fg">
                {section}
              </button>
            </>
          )}
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-fg/20">/</span>
              <button
                onClick={() => select(path.slice(0, i + 1))}
                className={cn(
                  "transition-colors hover:text-fg",
                  i === path.length - 1 && "font-semibold text-fg"
                )}
              >
                {p}
              </button>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <UploadButton
            context={{ course: code, section: currentSection }}
            label={currentSection ? "Upload here" : "Upload"}
            className="flex-shrink-0 whitespace-nowrap"
          />
          <div className="relative w-full sm:w-72">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg/40" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${code}`}
              placeholder={`Search in ${code}…`}
              className="w-full rounded-full glass py-2.5 pl-10 pr-4 text-sm text-fg placeholder:text-fg/35 outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
        </div>
      </div>

      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative mt-5 overflow-hidden rounded-[2rem] glass p-6 sm:p-8"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-50 blur-3xl"
          style={{ background: `radial-gradient(circle, ${activeLangMeta?.glow ?? cat?.glow}, transparent 70%)` }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            {cat && (
              <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.03] px-3 py-1 text-xs text-fg/60">
                {cat.label}
              </span>
            )}
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tightest text-fg sm:text-5xl">
              {code}
            </h1>
            <p className="mt-1.5 text-base text-fg/60">{title}</p>
            {activeLangMeta && (
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white/90"
                style={{ backgroundColor: activeLangMeta.color }}
              >
                <SectionGlyph name={section!} className="h-3.5 w-3.5" />
                {section}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <span className="font-display text-4xl font-semibold text-fg">{allFiles.length}</span>
              <span className="ml-1 text-sm text-fg/40">files</span>
            </div>
            <UploadButton
              context={{
                course: code,
                section: section ? (path.length > 0 ? `${section} / ${path.join(" / ")}` : section) : undefined,
              }}
              label="Contribute"
            />
          </div>
        </div>
      </motion.div>

      {/* body */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {/* ---- search ---- */}
          {view === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <p className="mb-4 text-sm text-fg/50">
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for “{query}”
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {searchResults.map((f, i) => (
                  <button
                    key={f.p}
                    onClick={() => openFile(f)}
                    className="group flex items-center gap-3 rounded-xl glass px-3 py-2.5 text-left transition-shadow hover:shadow-glow"
                  >
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-accent/[0.14] text-[9px] font-bold uppercase text-accent">
                      {f.ext}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{f.name}</span>
                      <span className="block truncate text-xs text-fg/40">{f.section || "-"}</span>
                    </span>
                    {f.community && (
                      <span className="flex-shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Student
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {searchResults.length === 0 && (
                <p className="mt-10 text-center text-sm text-fg/45">
                  Nothing in {code} matches “{query}”.
                </p>
              )}
            </motion.div>
          )}

          {/* ---- section grid (course entry) ---- */}
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
            >
              {recent.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-fg/45">
                    Recently opened
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((f) => (
                      <button
                        key={f.p}
                        onClick={() => openFile(f)}
                        className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-fg/70 transition-colors hover:text-fg"
                      >
                        <span className="font-bold uppercase text-accent">{f.ext}</span>
                        <span className="max-w-[14rem] truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Language picker cards for multi-lang courses */}
              {isMultiLang && (
                <div className="mb-6">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-fg/45">
                    Choose language
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {sections
                      .filter((s) => isLang(s.name))
                      .sort((a, b) => (a.name.toLowerCase() === "python" ? -1 : 1))
                      .map((s, i) => {
                        const lm = LANG_META[s.name.toLowerCase()];
                        const fileCount = countFiles(s);
                        return (
                          <motion.button
                            key={s.name}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                            whileHover={{ y: -5 }}
                            onClick={() => enterSection(s.name)}
                            className="group relative overflow-hidden rounded-[1.75rem] glass p-7 text-left transition-shadow hover:shadow-glow"
                          >
                            <div
                              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
                              style={{ background: `radial-gradient(circle, ${lm?.glow ?? cat?.glow}, transparent 70%)` }}
                            />
                            <span
                              className="relative grid h-14 w-14 place-items-center rounded-2xl border border-fg/10 bg-fg/[0.04] p-2.5 backdrop-blur-sm"
                            >
                              <SectionGlyph name={s.name} className="h-9 w-9" />
                            </span>
                            <h3 className="relative mt-5 font-display text-2xl font-semibold text-fg">
                              {s.name}
                            </h3>
                            <p className="relative mt-1.5 text-sm text-fg/50">
                              {lm?.desc ?? `${fileCount} files`}
                            </p>
                            <p className="relative mt-1 text-xs text-fg/35">
                              {fileCount > 0 ? (
                                `${fileCount} file${fileCount !== 1 ? "s" : ""} · ${childFolders(s).length} folder${childFolders(s).length !== 1 ? "s" : ""}`
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-medium text-accent">
                                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                  Initial folders ready · Contributions open
                                </span>
                              )}
                            </p>
                            <div className="relative mt-4 flex flex-wrap gap-1.5">
                              {childFolders(s)
                                .slice(0, 4)
                                .map((c) => (
                                  <span
                                    key={c.name}
                                    className="rounded-full border border-fg/10 bg-fg/[0.03] px-2.5 py-0.5 text-[11px] text-fg/55"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                            </div>
                          </motion.button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Standard section cards (non-language folders, or all sections for normal courses) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections.filter((s) => !isMultiLang || !isLang(s.name)).map((s, i) => (
                  <motion.button
                    key={s.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    whileHover={{ y: -5 }}
                    onClick={() => enterSection(s.name)}
                    className="group relative overflow-hidden rounded-[1.75rem] glass p-7 text-left transition-shadow hover:shadow-glow"
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-80"
                      style={{ background: `radial-gradient(circle, ${cat?.glow}, transparent 70%)` }}
                    />
                    <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-accent/[0.14] text-accent">
                      <SectionGlyph name={s.name} className="h-7 w-7" />
                    </span>
                    <h3 className="relative mt-5 font-display text-2xl font-semibold text-fg">
                      {s.name}
                    </h3>
                    <p className="relative mt-1 text-sm text-fg/50">
                      {countFiles(s)} files · {childFolders(s).length || "0"} folders
                    </p>
                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {childFolders(s)
                        .slice(0, 4)
                        .map((c) => (
                          <span
                            key={c.name}
                            className="rounded-full border border-fg/10 bg-fg/[0.03] px-2.5 py-0.5 text-[11px] text-fg/55"
                          >
                            {c.name}
                          </span>
                        ))}
                    </div>
                  </motion.button>
                ))}
              </div>

              {root.files.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-fg/45">
                    Loose files
                  </h2>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {root.files.map((f, i) => (
                      <FileRow key={f.p} f={f} onOpen={openFile} delay={i * 0.02} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---- explorer (tree + panel) ---- */}
          {view === "explorer" && section && (
            <motion.div
              key={`exp-${section}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]"
            >
              {/* tree */}
              <aside className="rounded-2xl glass p-2 lg:max-h-[calc(100svh-16rem)] lg:overflow-y-auto">
                <TreeNode
                  node={root.children[section]}
                  section={section}
                  path={[]}
                  activePath={path}
                  expanded={expanded}
                  onSelect={select}
                  onToggle={toggle}
                  depth={0}
                />
              </aside>

              {/* panel */}
              <div>
                {current && childFolders(current).length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-fg/40">
                      Folders
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {childFolders(current).map((c) => (
                        <button
                          key={c.name}
                          onClick={() => select([...path, c.name])}
                          className="group flex items-center gap-2.5 rounded-xl glass px-3 py-3 text-left transition-shadow hover:shadow-glow"
                        >
                          <Folder className="h-5 w-5 flex-shrink-0 text-accent/80" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-fg">{c.name}</span>
                            <span className="block text-xs text-fg/40">{countFiles(c)} files</span>
                          </span>
                          {isKeyFolder(c.name) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {current && current.files.length > 0 && (
                  <div>
                    {childFolders(current).length > 0 && (
                      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-fg/40">
                        Files
                      </h3>
                    )}
                    <motion.div layout className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <AnimatePresence mode="popLayout">
                        {current.files.map((f, i) => (
                          <FileRow key={f.p} f={f} onOpen={openFile} delay={Math.min(i * 0.02, 0.2)} />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                )}

                {current && current.files.length === 0 && childFolders(current).length === 0 && (
                  <div className="mx-auto mt-12 max-w-md rounded-2xl glass p-8 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-fg/[0.04] text-fg/40">
                      <Folder className="h-6 w-6" />
                    </div>
                    <p className="text-base font-medium text-fg/80">This folder is empty</p>
                    <p className="mt-1 text-sm text-fg/45">
                      {section && isLang(section)
                        ? `Be the first to share ${section} materials for ${code}!`
                        : "Be the first to contribute notes, slides or solutions."}
                    </p>
                    <div className="mt-5 flex justify-center">
                      <UploadButton
                        context={{
                          course: code,
                          section: section ? (path.length > 0 ? `${section} / ${path.join(" / ")}` : section) : undefined,
                        }}
                        label="Contribute files"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
