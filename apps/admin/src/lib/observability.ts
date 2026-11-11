import { consoleErrorReporter, setErrorReporter, type ErrorReporter } from "@utils";

/** The admin app's observability integration point; see apps/web/src/lib/observability.ts for the wiring pattern. */
export function installErrorReporter(reporter: ErrorReporter | null): void {
  setErrorReporter(reporter);
}

/** Development only: print reported errors to the console so they are not lost silently. */
export function installDevelopmentReporter(): void {
  if (process.env.NODE_ENV === "development") installErrorReporter(consoleErrorReporter);
}
