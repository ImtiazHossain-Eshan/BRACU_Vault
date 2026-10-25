import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env";
import { onError } from "./middleware/errors";
import { healthController } from "./controllers/health.controller";
import { verifyController } from "./controllers/verify.controller";
import { uploadsController } from "./controllers/uploads.controller";
import { adminController } from "./controllers/admin.controller";
import { catalogController } from "./controllers/catalog.controller";

/** Worker entry. Routes are mounted as feature controllers under /api/v1.
 *  Business logic lives in services/repositories - controllers stay thin. */
const app = new Hono<AppEnv>();

app.onError(onError);

// CORS - allow the static site (dev + prod) to call the API with a Clerk
// Bearer token. Origin is echoed only for the allowlisted hosts.
app.use("/api/v1/*", cors({
  origin: (origin, c) => {
    const site = c.env.SITE_URL; // e.g. https://bracuvault.me
    const allowed = new Set([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      site,
      site.replace("://", "://www."), // allow the www host too
    ]);
    return origin && allowed.has(origin) ? origin : "";
  },
  allowHeaders: ["Authorization", "Content-Type"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  maxAge: 86400,
}));

app.get("/", (c) =>
  c.json({ name: "BRACU Vault API", version: "v1", status: "running" }),
);

app.route("/api/v1", healthController);
app.route("/api/v1", catalogController);
app.route("/api/v1", verifyController);
app.route("/api/v1", uploadsController);
app.route("/api/v1", adminController);

export default app;
