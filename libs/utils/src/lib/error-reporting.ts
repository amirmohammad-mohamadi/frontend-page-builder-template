/**
 * Vendor-neutral error reporting.
 *
 * Application code calls `captureError` and `setErrorReportingUser`. A
 * project plugs its tracking vendor in once with `setErrorReporter` (for
 * example in an `instrumentation-client.ts` or an `instrumentation.ts`).
 * Without a reporter every call is a no-op, so the template runs with no
 * vendor dependency and nothing to configure.
 */

/** What a reporter must do. Any error-tracking SDK can be adapted to this shape. */
export type ErrorReporter = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  setUser: (user: { id: string } | null) => void;
};

/** Digests Next.js attaches to thrown navigation control flow (`notFound()`, `redirect()`); not errors. */
const NEXT_CONTROL_FLOW_DIGESTS = [
  /^NEXT_NOT_FOUND$/,
  /^NEXT_HTTP_ERROR_FALLBACK;404$/,
  /^NEXT_REDIRECT/,
];

/**
 * Whether an error is worth reporting: not Next.js control flow, and not a
 * 4xx the API returned for bad input or an unauthenticated visitor. A 403
 * stays reportable, since it usually means the UI offered an action the
 * caller was not allowed; 5xx and network failures stay reportable too.
 */
export function isReportableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return true;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest === "string" && NEXT_CONTROL_FLOW_DIGESTS.some((p) => p.test(digest)))
    return false;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (
    typeof statusCode === "number" &&
    statusCode >= 400 &&
    statusCode < 500 &&
    statusCode !== 403
  ) {
    return false;
  }
  return true;
}

const MAX_PENDING_REPORTS = 30;

const state: {
  reporter: ErrorReporter | null;
  pending: Array<{ error: unknown; context?: Record<string, unknown> }>;
  user: { id: string } | null | undefined;
} = { reporter: null, pending: [], user: undefined };

/**
 * Installs the reporter. Reports made before this call (an SDK loaded after
 * the page became interactive) are replayed into it in order, as is the last
 * user. Pass `null` to uninstall.
 */
export function setErrorReporter(reporter: ErrorReporter | null): void {
  state.reporter = reporter;
  if (!reporter) return;
  if (state.user !== undefined) reporter.setUser(state.user);
  for (const { error, context } of state.pending.splice(0))
    reporter.captureException(error, context);
}

/** Reports an error with optional structured context. No-op for expected outcomes (`isReportableError`) and without a reporter. */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!isReportableError(error)) return;
  if (state.reporter) {
    state.reporter.captureException(error, context);
    return;
  }
  if (state.pending.push({ error, context }) > MAX_PENDING_REPORTS) state.pending.shift();
}

/**
 * A reporter for development that prints reports to the console, so nothing
 * is lost silently before a vendor is wired. Install it only when
 * `NODE_ENV === "development"`; never in production.
 */
export const consoleErrorReporter: ErrorReporter = {
  captureException: (error, context) => console.warn("[error-reporting]", error, context ?? ""),
  setUser: () => undefined,
};

/** Tags later reports with the signed-in user's id only, or clears it with `null`. */
export function setErrorReportingUser(id: string | null): void {
  state.user = id === null ? null : { id };
  state.reporter?.setUser(state.user);
}
