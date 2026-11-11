import { consoleErrorReporter, setErrorReporter, type ErrorReporter } from "@utils";

/**
 * The observability integration point. The template ships no vendor: until a
 * reporter is installed, `captureError` calls are dropped (the last 30 are
 * replayed once one arrives). To add a vendor, install its SDK, initialise
 * it here (or in `instrumentation-client.ts`) and adapt it to `ErrorReporter`:
 *
 *   import * as Vendor from "vendor-sdk";
 *   Vendor.init({ dsn: process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN });
 *   installErrorReporter({
 *     captureException: (error, context) => Vendor.captureException(error, { extra: context }),
 *     setUser: (user) => Vendor.setUser(user),
 *   });
 */
export function installErrorReporter(reporter: ErrorReporter | null): void {
  setErrorReporter(reporter);
}

/** Development only: print reported errors to the console so they are not lost silently. */
export function installDevelopmentReporter(): void {
  if (process.env.NODE_ENV === "development") installErrorReporter(consoleErrorReporter);
}
