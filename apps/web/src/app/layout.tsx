/**
 * Pass-through by design: the document shell lives in `[locale]/layout.tsx`,
 * the first layout that knows the locale. Routes outside `[locale]`
 * (`not-found.tsx`, `global-error.tsx`, `api/`) render their own shell or none.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
