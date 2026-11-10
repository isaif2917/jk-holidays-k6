// JSON response helpers. Every failure body is { error: "<message>" } because the
// browser wrapper in src/lib/admin.functions.ts reads `.error` out of it to feed
// toast.error() — see callAdminOps/errorMessage there before changing this shape.
import { cors } from "./cors.ts";

/** An error with an intended HTTP status. Anything else becomes a generic 500. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "content-type": "application/json" },
  });
}

export function fail(req: Request, status: number, error: string): Response {
  return json(req, status, { error });
}
