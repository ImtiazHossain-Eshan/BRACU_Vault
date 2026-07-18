import { Hono } from "hono";
import type { AppEnv } from "../env";
import { getDb } from "../db/client";
import { RosterRepository } from "../repositories/roster.repository";
import { nowSec } from "../lib/crypto";

/** Liveness + dependency check. Proves the Worker → D1 binding end-to-end by
 *  reading the roster count. Returns "degraded" (not 500) if the DB is
 *  unreachable so uptime monitors get a clear signal without noisy errors. */
export const healthController = new Hono<AppEnv>();

healthController.get("/health", async (c) => {
  const db = getDb(c.env);
  let dbOk = false;
  let rosterCount = 0;

  try {
    rosterCount = await new RosterRepository(db).count();
    dbOk = true;
  } catch (err) {
    console.error("[health] db check failed:", err);
  }

  return c.json(
    {
      status: dbOk ? "ok" : "degraded",
      db: dbOk,
      rosterCount,
      environment: c.env.ENVIRONMENT ?? "unknown",
      time: nowSec(),
    },
    dbOk ? 200 : 503,
  );
});
