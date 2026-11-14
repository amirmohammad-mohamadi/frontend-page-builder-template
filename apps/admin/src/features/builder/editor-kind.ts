/** The two editor shells the admin can mount. */
export type EditorKind = "core" | "studio";

/** Hosts where the Studio SDK runs without a licence key (its development mode). */
const LOCAL_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Which editor to mount: the configured one, except that `studio` without a licence key falls
 * back to Core away from localhost (the SDK refuses to run there), with `notice` set so the
 * shell can say why. On localhost the SDK's development mode needs no key.
 *
 * @param configured `NEXT_PUBLIC_BUILDER_EDITOR`
 * @param licenseKey `NEXT_PUBLIC_GRAPESJS_LICENSE_KEY`
 * @param hostname the browser's `location.hostname`
 */
export function resolveEditorKind(
  configured: EditorKind,
  licenseKey: string,
  hostname: string
): { kind: EditorKind; notice: boolean } {
  if (configured !== "studio") return { kind: "core", notice: false };
  if (licenseKey.trim() !== "" || LOCAL_HOSTS.has(hostname))
    return { kind: "studio", notice: false };
  return { kind: "core", notice: true };
}
