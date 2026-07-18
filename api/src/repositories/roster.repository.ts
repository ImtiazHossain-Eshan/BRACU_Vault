import { eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { studentRoster } from "../db/schema";

/** Data access for the student roster. No business logic here — just queries. */
export class RosterRepository {
  constructor(private readonly db: Db) {}

  /** True if a roster row exists for the given HMAC of a Student ID. */
  async existsByHmac(hmac: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: studentRoster.id })
      .from(studentRoster)
      .where(eq(studentRoster.studentIdHmac, hmac))
      .limit(1);
    return rows.length > 0;
  }

  /** Total roster size — used by the health check to prove DB wiring. */
  async count(): Promise<number> {
    const rows = await this.db
      .select({ c: sql<number>`count(*)` })
      .from(studentRoster);
    return rows[0]?.c ?? 0;
  }
}
