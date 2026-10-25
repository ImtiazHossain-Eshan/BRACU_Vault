import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Global client state - bookmarks and recently-viewed courses - persisted to
 * localStorage. Hydration is deferred (`skipHydration`) and triggered from
 * <PlatformChrome> after mount, so SSR never touches localStorage.
 */
interface VaultState {
  bookmarks: string[]; // file ids
  recentCourses: string[]; // course codes, most-recent first
  toggleBookmark: (id: string) => void;
  addRecentCourse: (code: string) => void;
  clearRecents: () => void;
  clearBookmarks: () => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      bookmarks: [],
      recentCourses: [],
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((x) => x !== id)
            : [id, ...s.bookmarks],
        })),
      addRecentCourse: (code) =>
        set((s) => ({
          recentCourses: [
            code,
            ...s.recentCourses.filter((c) => c !== code),
          ].slice(0, 8),
        })),
      clearRecents: () => set({ recentCourses: [] }),
      clearBookmarks: () => set({ bookmarks: [] }),
    }),
    {
      name: "bracu-vault-store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
