/** Typed application error carrying an HTTP status. Thrown from any layer and
 *  translated to a JSON response by the central error handler (middleware/errors).
 *  Keeps controllers free of try/catch and guarantees a consistent envelope. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Convenience constructors for the common cases. */
export const Errors = {
  badRequest: (m = "Bad request", d?: unknown) => new HttpError(400, m, d),
  unauthorized: (m = "Sign in to continue.") => new HttpError(401, m),
  forbidden: (m = "You don't have permission to do that.") => new HttpError(403, m),
  notFound: (m = "Not found") => new HttpError(404, m),
  conflict: (m = "Already exists", d?: unknown) => new HttpError(409, m, d),
  unsupportedMedia: (m = "Expected application/json") => new HttpError(415, m),
  tooMany: (m = "Too many requests. Try again later.") => new HttpError(429, m),
};
