"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { VaultFile } from "@/lib/types";
import { courseHref } from "@/lib/vault-data";
import { TYPE_TOKEN } from "@/lib/ui-meta";
import BookmarkButton from "./BookmarkButton";
import Highlight from "./Highlight";
import Sheen from "../ui/Sheen";

export default function FileRow({
  file,
  query = "",
  index = 0,
}: {
  file: VaultFile;
  query?: string;
  index?: number;
}) {
  const token = TYPE_TOKEN[file.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.018, 0.22),
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -3 }}
      className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl glass px-3.5 py-3 transition-shadow hover:shadow-glow"
    >
      <Sheen />
      <span
        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase tracking-wide"
        style={{
          background: `rgb(var(${token}) / 0.16)`,
          color: `rgb(var(${token}))`,
        }}
      >
        {file.format}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={courseHref(file.course)}
          className="block truncate text-sm font-semibold text-fg"
        >
          <Highlight text={file.title} query={query} />
        </Link>
        <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-fg/45">
          <span className="font-medium text-fg/70">{file.course}</span>
          <span className="h-1 w-1 rounded-full bg-fg/20" />
          <span>{file.type}</span>
          <span className="h-1 w-1 rounded-full bg-fg/20" />
          <span>
            {file.semester} {file.year}
          </span>
          <span className="hidden sm:inline">· {file.size}</span>
        </div>
      </div>
      <BookmarkButton id={file.id} />
    </motion.div>
  );
}
