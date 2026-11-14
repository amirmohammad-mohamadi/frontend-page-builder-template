"use client";

import { useMemo } from "react";
import { usePage } from "@services";
import { env } from "@/env";
import { resolveEditorKind } from "./editor-kind";

/**
 * Loads the page the builder edits and decides which editor shell to mount. The decision reads
 * `location.hostname`, so it is made in the browser (the builder is client-only anyway).
 */
export function useBuilderPage(id: string) {
  const query = usePage(id);
  const editor = useMemo(
    () =>
      resolveEditorKind(
        env.NEXT_PUBLIC_BUILDER_EDITOR,
        env.NEXT_PUBLIC_GRAPESJS_LICENSE_KEY,
        typeof window === "undefined" ? "" : window.location.hostname
      ),
    []
  );
  const notFound = query.isError && query.error.statusCode === 404;

  return { query, notFound, editorKind: editor.kind, studioNotice: editor.notice };
}
