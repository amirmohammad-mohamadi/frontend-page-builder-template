"use client";

import { useEffect } from "react";
import { Button } from "@components";
import { captureError } from "@utils";
import { TEXTS } from "@/texts";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: "root" });
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold">{TEXTS.common.somethingWentWrong}</h1>
      <Button className="mt-6" onClick={reset}>
        {TEXTS.common.retry}
      </Button>
    </div>
  );
}
