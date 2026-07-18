import type { Config } from "drizzle-kit";

/** drizzle-kit reads this to generate D1/SQLite migrations from src/db/schema.ts.
 *  Run: npm run db:generate  → writes ./migrations/<n>_<name>.sql
 *  Apply: npm run db:apply:local  (or db:apply for --remote). */
export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
} satisfies Config;
