"use client";

import type { Editor } from "grapesjs";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { PageContentDto } from "@dtos";
import type { PageModel } from "@models";
import { usePublishPage, useUpdatePage } from "@services";
import { captureError } from "@utils";
import { env } from "@/env";
import {
  getEditingLocale,
  setEditingLocale,
  subscribeEditingLocale,
} from "@/grapesjs/editor/editing-locale";
import { TEXTS } from "@/texts";
import { buildDraftSignature, isDraftChanged } from "./draft-signature";
import type { EditorKind } from "./editor-kind";
import { readDraft, toProjectData } from "./page-project";
import { useEditorEvents } from "./use-editor-events";

/** Events after which the draft signature is re-read (once per animation frame). */
const DRAFT_EVENTS = "update undo redo load project:load";

type Props = {
  page: PageModel;
  kind: EditorKind;
};

/**
 * The builder document: loads the page's draft into the editor (Core; the Studio host loads it
 * through its own storage), tracks unsaved changes through a draft signature, and saves,
 * publishes and previews through the `@services` hooks. Both shells hand their editor to
 * `handleEditor` and share the toolbar this feeds.
 */
export function useBuilderEditor({ page, kind }: Props) {
  const pageId = page.getId();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const editingLocale = useSyncExternalStore(
    subscribeEditingLocale,
    getEditingLocale,
    getEditingLocale
  );

  const currentSignature = useEditorEvents(
    editor,
    DRAFT_EVENTS,
    (current) => buildDraftSignature(readDraft(current)),
    ""
  );
  const loaded = savedSignature !== null;
  const dirty = loaded && isDraftChanged(currentSignature, savedSignature);

  const handleEditor = useCallback((created: Editor) => setEditor(created), []);

  // Core: the route owns the load. Deferred a tick so React finishes its commit before GrapesJS
  // rebuilds the canvas frame.
  useEffect(() => {
    if (!editor || kind !== "core") return;
    const draft = page.getDraft();
    const timer = setTimeout(() => editor.loadProjectData(toProjectData(draft)), 0);
    return () => clearTimeout(timer);
    // The draft is loaded once per page; a refetch after a save must not reload the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, kind, pageId]);

  // Both shells: a load is the baseline the unsaved indicator compares with, and a load's own
  // changes leave the undo stack.
  useEffect(() => {
    if (!editor) return;
    const onLoad = () => {
      editor.UndoManager.clear();
      setSavedSignature(buildDraftSignature(readDraft(editor)));
    };
    editor.on("project:load", onLoad);
    return () => {
      editor.off("project:load", onLoad);
    };
  }, [editor]);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = TEXTS.builder.leaveWarning;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = useUpdatePage();
  const publish = usePublishPage();

  /** Saves `draft` (what the editor holds by default) and records it as the saved state. */
  const saveDraft = useCallback(
    async (draft?: PageContentDto, quiet = false): Promise<boolean> => {
      if (!editor) return false;
      const content = draft ?? readDraft(editor);
      try {
        await update.mutateAsync({ id: pageId, data: { draft: content } });
        setSavedSignature(buildDraftSignature(content));
        if (!quiet) toast.success(TEXTS.builder.draftSaved);
        return true;
      } catch (error) {
        // The mutation hook has shown the toast; the caller only needs to stop.
        captureError(error, { area: "builder-save" });
        return false;
      }
    },
    [editor, pageId, update]
  );

  const confirmPublish = useCallback(async () => {
    if (dirty && !(await saveDraft(undefined, true))) return;
    try {
      await publish.mutateAsync(pageId);
      toast.success(TEXTS.builder.published);
      setPublishOpen(false);
    } catch (error) {
      captureError(error, { area: "builder-publish" });
    }
  }, [dirty, pageId, publish, saveDraft]);

  const openPreview = useCallback(() => {
    const url = `${env.NEXT_PUBLIC_WEB_APP_URL}/${editingLocale}/preview/${page.getSlug()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [editingLocale, page]);

  return {
    editor,
    handleEditor,
    editingLocale,
    setEditingLocale,
    dirty,
    loaded,
    saveDraft,
    isSaving: update.isPending,
    isPublishing: publish.isPending,
    publishOpen,
    setPublishOpen,
    confirmPublish,
    openPreview,
  };
}
