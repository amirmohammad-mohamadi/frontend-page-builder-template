import type { Block, Component, ContentType, Editor } from "grapesjs";
import { useState, type DragEvent } from "react";
import { toast } from "sonner";
import { TEXTS } from "@/texts";
import { useEditorEvents } from "../../use-editor-events";
import { toBlockGroups } from "./block-groups";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
};

/**
 * What the palette depends on, as one string so `useEditorEvents` compares it cheaply: each
 * block's id, label, category and media. Core fires `block:custom` after any block change.
 */
const readBlocksKey = (editor: Editor) =>
  editor.Blocks.getAll()
    .models.map((block) =>
      [block.getId(), block.getLabel(), block.getCategoryLabel(), block.getMedia()].join("\u0000")
    )
    .join("\u0001");

/**
 * Where a clicked block goes, like core's own `appendOnClick`: inside the selected component,
 * else right after it in its parent, else at the end of the page. `null` when every candidate
 * refuses the block (its `draggable`/`droppable` rules, checked by `Components.canMove`).
 */
function findAppendTarget(
  editor: Editor,
  content: ContentType
): { target: Component; at?: number } | null {
  const selected = editor.getSelected();
  const parent = selected?.parent();
  const wrapper = editor.getWrapper();
  const candidates = [
    selected && { target: selected },
    selected && parent && { target: parent, at: parent.components().indexOf(selected) + 1 },
    wrapper && { target: wrapper },
  ];

  const sources = Array.isArray(content) ? content : [content];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const accepted = sources.every(
      (source, index) =>
        editor.Components.canMove(
          candidate.target,
          source,
          candidate.at === undefined ? undefined : candidate.at + index
        ).result
    );
    if (accepted) return candidate;
  }
  return null;
}

/**
 * State and handlers for the Blocks palette on core's headless BlockManager
 * (`blockManager.custom: true`): the blocks grouped by category with search and collapsing,
 * native drag into the canvas through `Blocks.startDrag` / `Blocks.endDrag`, and click (or
 * Enter) to append the block where core's `appendOnClick` would.
 */
export const useBlocksPanel = ({ editor }: Props) => {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Re-renders the palette when a block is added, removed or relabelled.
  useEditorEvents(editor, "block:custom", readBlocksKey, "");

  const groups = editor ? toBlockGroups(editor.Blocks.getAll().models, query) : [];
  const searching = query.trim() !== "";

  const isCollapsed = (category: string) => !searching && Boolean(collapsed[category]);

  const toggleCategory = (category: string) => {
    setCollapsed((current) => ({ ...current, [category]: !current[category] }));
  };

  const startDrag = (block: Block, event: DragEvent<HTMLElement>) => {
    if (!editor) return;
    event.dataTransfer.effectAllowed = "copy";
    editor.Blocks.startDrag(block, event.nativeEvent);
  };

  // A drag dropped nowhere, or cancelled with Escape over the canvas, ends with `dropEffect`
  // "none"; core then removes its placeholder instead of inserting the block there.
  const endDrag = (event: DragEvent<HTMLElement>) => {
    editor?.Blocks.endDrag(event.dataTransfer.dropEffect === "none");
  };

  const appendBlock = (block: Block) => {
    if (!editor) return;
    const rawContent = block.getContent();
    const content = typeof rawContent === "function" ? rawContent() : rawContent;
    if (!content) return;

    const placement = findAppendTarget(editor, content);
    if (!placement) {
      toast.error(TEXTS.builder.shell.blocksAppendRefused);
      return;
    }
    const [added] = placement.target.append(content, { at: placement.at });
    if (added) editor.select(added, { scroll: true });
  };

  return {
    groups,
    query,
    setQuery,
    searching,
    isCollapsed,
    toggleCategory,
    startDrag,
    endDrag,
    appendBlock,
  };
};
