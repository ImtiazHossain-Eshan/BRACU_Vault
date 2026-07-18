import type { Db } from "../db/client";
import { fileOverrides } from "../db/schema";
import { nowSec } from "../lib/crypto";

export type OverrideRow = typeof fileOverrides.$inferSelect;

export interface OverridePatch {
  hidden?: boolean;
  name?: string | null;
  course?: string | null;
  section?: string | null;
  size?: number | null;
}

const FIELDS = ["hidden", "name", "course", "section", "size"] as const;

/** Data access for admin overrides of the static archive files. */
export class OverrideRepository {
  constructor(private readonly db: Db) {}

  all(): Promise<OverrideRow[]> {
    return this.db.select().from(fileOverrides);
  }

  /** Upsert an override, applying only the provided fields. */
  async set(p: string, patch: OverridePatch, actorId: string): Promise<void> {
    const clean: Record<string, unknown> = {};
    for (const k of FIELDS) if (patch[k] !== undefined) clean[k] = patch[k];
    const ts = nowSec();
    await this.db
      .insert(fileOverrides)
      .values({ p, ...clean, updatedBy: actorId, updatedAt: ts })
      .onConflictDoUpdate({
        target: fileOverrides.p,
        set: { ...clean, updatedBy: actorId, updatedAt: ts },
      });
  }
}
