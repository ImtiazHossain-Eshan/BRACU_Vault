import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";
import * as schema from "./schema";

/** Build a typed Drizzle client bound to the request's D1 instance.
 *  Cheap to construct per request (the binding is already a live connection). */
export function getDb(env: Env) {
  return drizzle(env.bracu_vault, { schema });
}

export type Db = ReturnType<typeof getDb>;
