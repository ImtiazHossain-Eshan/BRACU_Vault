import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { users } from "../db/schema";
import { uuid } from "../lib/crypto";

export type UserRow = typeof users.$inferSelect;

/** Data access for the domain `users` table (identity links to Clerk). */
export class UserRepository {
  constructor(private readonly db: Db) {}

  async getByClerkId(clerkUserId: string): Promise<UserRow | undefined> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    return rows[0];
  }

  /** Get the domain user for a Clerk identity, creating a `pending` row on first
   *  sight. The clerk_user_id unique index makes concurrent creates safe. */
  async ensureFromClerk(clerkUserId: string, email: string): Promise<UserRow> {
    const existing = await this.getByClerkId(clerkUserId);
    if (existing) return existing;

    await this.db
      .insert(users)
      .values({ id: uuid(), clerkUserId, email, status: "pending" })
      .onConflictDoNothing();

    const row = await this.getByClerkId(clerkUserId);
    if (!row) throw new Error("Failed to create user record.");
    return row;
  }
}
