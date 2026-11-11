import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TEXTS } from "@/texts";

export const metadata: Metadata = {
  title: { default: TEXTS.appName, template: `%s · ${TEXTS.appName}` },
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
