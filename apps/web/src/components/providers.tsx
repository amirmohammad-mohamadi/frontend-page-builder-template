"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@services";
import { Toaster } from "@components";
import "@/lib/api-client-setup";
import { installDevelopmentReporter } from "@/lib/observability";
import { AuthEventHandler } from "./auth-event-handler";

/** Client-side context for every page: theme, react-query, toasts, and the auth event listener. */
export function Providers({
  children,
  mutationErrorFallback,
}: {
  children: ReactNode;
  mutationErrorFallback?: string;
}) {
  useEffect(() => {
    installDevelopmentReporter();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider mutationErrorFallback={mutationErrorFallback}>
        <AuthEventHandler />
        {children}
        <Toaster position="bottom-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
