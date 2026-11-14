/**
 * The full-screen editor group: no sidebar and no header, the editor owns the viewport. Every
 * route here needs a session, which `proxy.ts` enforces for the whole app; nothing is
 * prerendered since the page is per operator.
 */
export const dynamic = "force-dynamic";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background text-foreground h-dvh overflow-hidden">{children}</div>;
}
