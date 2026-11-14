"use client";

import StudioEditor from "@grapesjs/studio-sdk/react";
import "@grapesjs/studio-sdk/style";
import "grapesjs/dist/css/grapes.min.css";
import { useQueryClient } from "@tanstack/react-query";
import type { Editor } from "grapesjs";
import { useEffect, useMemo, useRef } from "react";
import type { PageContentDto } from "@dtos";
import type { PageModel } from "@models";
import { getGjsEditor, setGjsEditor } from "@components/builder";
import { env } from "@/env";
import { getStudioEditorOptions } from "@/grapesjs/editor/studio-options";
import { fromProjectData, toProjectData } from "./page-project";

type Props = {
  page: PageModel;
  /** Called once with the Studio-created GrapesJS editor. */
  onEditor: (editor: Editor) => void;
  /** Saves a draft the SDK wants stored (its autosave and save command). */
  onSave: (draft: PageContentDto, quiet?: boolean) => Promise<boolean>;
};

/**
 * The optional Studio SDK host: the SDK's own layout around the same builder plugin, canvas
 * renderer and page format as the Core shell. The page's draft is handed over as the project
 * and saved through `onSave`. This file and `studio-options.ts` are the only modules that may
 * import `@grapesjs/studio-sdk`, so a Core-only deployment never bundles it.
 */
export function StudioHost({ page, onEditor, onSave }: Props) {
  const queryClient = useQueryClient();
  const onSaveRef = useRef(onSave);
  const onEditorRef = useRef(onEditor);
  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    onSaveRef.current = onSave;
    onEditorRef.current = onEditor;
  });

  // Memoised on the page id only: the SDK rebuilds the whole editor on a new options object,
  // and a refetch after a save must not do that.
  const pageId = page.getId();
  const options = useMemo(
    () =>
      getStudioEditorOptions({
        licenseKey: env.NEXT_PUBLIC_GRAPESJS_LICENSE_KEY,
        project: toProjectData(page.getDraft()),
        queryClient,
        onSave: async (project) => {
          const css = editorRef.current?.getCss({ avoidProtected: true }) ?? "";
          await onSaveRef.current(fromProjectData(project, css), true);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageId, queryClient]
  );

  useEffect(
    () => () => {
      if (editorRef.current && getGjsEditor() === editorRef.current) setGjsEditor(null);
    },
    []
  );

  return (
    <div className="builder-studio-host min-h-0 flex-1">
      <StudioEditor
        options={options}
        className="h-full"
        onEditor={(editor) => {
          editorRef.current = editor;
          setGjsEditor(editor);
          onEditorRef.current(editor);
        }}
      />
    </div>
  );
}
