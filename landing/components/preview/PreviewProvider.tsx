"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import PreviewModal, { type PreviewFile } from "./PreviewModal";

interface PreviewCtx {
  open: (file: PreviewFile) => void;
  close: () => void;
}

const Ctx = createContext<PreviewCtx>({ open: () => {}, close: () => {} });

export function usePreview() {
  return useContext(Ctx);
}

export default function PreviewProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<PreviewFile | null>(null);
  const open = useCallback((f: PreviewFile) => setFile(f), []);
  const close = useCallback(() => setFile(null), []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      <PreviewModal file={file} onClose={close} />
    </Ctx.Provider>
  );
}
