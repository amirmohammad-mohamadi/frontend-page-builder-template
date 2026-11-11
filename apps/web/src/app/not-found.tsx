import Link from "next/link";
import "./globals.css";

/**
 * Reached only for a path with no valid locale segment (`/nothing`), so there
 * is no locale to translate with; the locale-aware page is `[locale]/not-found.tsx`.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">404</p>
          <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
          <Link href="/" className="text-primary mt-4 inline-block underline">
            Go to the home page
          </Link>
        </div>
      </body>
    </html>
  );
}
