"use client";

import { useEffect } from "react";
import { captureError } from "@utils";
import "./globals.css";

/** The last resort when the locale layout itself fails; renders its own document, in English. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
