"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@services";
import { Toaster } from "@components";
import "@/lib/api-client-setup";
import { installDevelopmentReporter } from "@/lib/observability";
import { TEXTS } from "@/texts";
import { AuthEventHandler } from "./auth-event-handler";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    installDevelopmentReporter();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider mutationErrorFallback={TEXTS.common.somethingWentWrong}>
        <AuthEventHandler />
        {children}
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
