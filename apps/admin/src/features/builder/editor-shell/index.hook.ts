"use client";

import { useQueryClient } from "@tanstack/react-query";
import grapesjs, { type Editor } from "grapesjs";
import { useEffect, useRef, useState } from "react";
import { getGjsEditor, setGjsEditor } from "@components/builder";
import { createAssetPickerController } from "@/grapesjs/editor/asset-picker-controller";
import { getCoreEditorConfig } from "@/grapesjs/editor/core-config";
import { CORE_COMMANDS } from "./panels/top-bar.hook";
import { useEditorEvents } from "../use-editor-events";

export type LeftTab = "blocks" | "layers";
export type RightTab = "properties" | "styles";

type Props = {
  /** Called once, synchronously after `grapesjs.init`, with the new editor. */
  onEditor: (editor: Editor) => void;
};

/**
 * Owns the GrapesJS core editor behind the builder shell: creates it once from
 * `getCoreEditorConfig` with the shell's canvas container and panel slots, hands it to
 * `onEditor`, and destroys it on unmount. The page itself is loaded by the builder document
 * hook, never here. Also tracks core's preview, during which the shell hides its columns.
 */
export const useEditorShell = ({ onEditor }: Props) => {
  const [leftTab, setLeftTab] = useState<LeftTab>("blocks");
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  // The live editor for panels that subscribe to its events; `null` until init and after destroy.
  const [editor, setEditor] = useState<Editor | null>(null);
  // The Asset Manager opens the shell's media picker through this store; created once.
  const [assetPicker] = useState(createAssetPickerController);

  const containerRef = useRef<HTMLDivElement>(null);
  const traitsRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const stylesRef = useRef<HTMLDivElement>(null);
  const selectorsRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const destroyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The editor is created once and never re-created for a new prop, so the
  // init effect reads its inputs through refs instead of listing them as deps.
  const onEditorRef = useRef(onEditor);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  useEffect(() => {
    onEditorRef.current = onEditor;
    queryClientRef.current = queryClient;
  });

  // Creates the editor exactly once per mounted shell. Dev StrictMode unmounts and remounts
  // every effect straight away; the destroy is deferred by a tick so that remount cancels it
  // and keeps the same editor, instead of building a second editor and canvas frame.
  useEffect(() => {
    if (destroyTimerRef.current) {
      clearTimeout(destroyTimerRef.current);
      destroyTimerRef.current = null;
    }

    const container = containerRef.current;
    if (!editorInstanceRef.current && container) {
      const created = grapesjs.init(
        getCoreEditorConfig({
          container,
          queryClient: queryClientRef.current,
          slots: {
            traits: traitsRef.current ?? undefined,
            layers: layersRef.current ?? undefined,
            styles: stylesRef.current ?? undefined,
            selectors: selectorsRef.current ?? undefined,
          },
          assetPicker,
        })
      );
      editorInstanceRef.current = created;
      setGjsEditor(created);
      onEditorRef.current(created);
      setEditor(created);
    }

    return () => {
      destroyTimerRef.current = setTimeout(() => {
        destroyTimerRef.current = null;
        const current = editorInstanceRef.current;
        editorInstanceRef.current = null;
        if (!current) return;
        if (getGjsEditor() === current) setGjsEditor(null);
        setEditor(null);
        current.destroy();
      }, 0);
    };
  }, [assetPicker]);

  // Core's preview only hides core's own panels (there are none); the shell hides its columns
  // itself, and the canvas re-measures once they are gone or back.
  const preview = useEditorEvents(
    editor,
    "command:call",
    (current) => current.Commands.isActive(CORE_COMMANDS.preview),
    false
  );

  useEffect(() => {
    editor?.refresh();
  }, [editor, preview]);

  const exitPreview = () => {
    editor?.stopCommand(CORE_COMMANDS.preview);
  };

  return {
    editor,
    assetPicker,
    containerRef,
    traitsRef,
    layersRef,
    stylesRef,
    selectorsRef,
    leftTab,
    setLeftTab,
    rightTab,
    setRightTab,
    preview,
    exitPreview,
  };
};
