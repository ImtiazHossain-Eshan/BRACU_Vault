/** Edge-safe crypto helpers built on Web Crypto (no Node APIs). Used for roster
 *  hashing, OTP hashing, and random identifiers across services. */

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** HMAC-SHA256(message) → hex. Stable for a given secret; used to store Student
 *  IDs and OTP codes as non-reversible digests. */
export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

/** SHA-256(message) → hex. */
export async function sha256Hex(message: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(message)));
}

/** SHA-256 of raw bytes → hex (for upload content hashing / dedupe). */
export async function sha256BytesHex(buf: ArrayBuffer): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", buf));
}

/** RFC 4122 v4 id. */
export function uuid(): string {
  return crypto.randomUUID();
}

/** Current time in unix seconds (matches the DB integer timestamps). */
export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}
