import type { Component, Editor } from "grapesjs";
import type { QueryClient } from "@tanstack/react-query";
import {
  BUILDER_BLOCK_LIST,
  type BuilderBlockDefinition,
  type ComponentJSON,
} from "@components/builder";
import { installIdTrait, registerAllCustomTraitTypes, toTraits } from "../fields";
import { canvasRendererConfig } from "../renderer";
import { createCanvasRenderer } from "../renderer/canvas-renderer";
import { installCanvasStyles } from "./canvas-styles";
import { registerFieldVisibility } from "./field-visibility";
import { fillPaletteIconMarkup } from "./palette-icons";
import { registerSelectionPruning } from "./selection-pruning";

export type CreateBuilderPluginProps = {
  /** The host's React Query client, handed to the canvas renderer. */
  queryClient?: QueryClient;
  /** The blocks to register; the whole library by default. */
  blocks?: readonly BuilderBlockDefinition[];
  /** Whether the canvas copies the admin's stylesheets into its frames (off in tests). */
  canvasStyles?: boolean;
};

/**
 * Whether `source` may be dropped into `target`, by the block definitions: a block that names
 * `children` takes only those types; a block that names a `childOf` goes only into that parent.
 *
 * @param blocks the registered blocks by type
 * @param source the component being moved (or its definition)
 * @param target the component it is dropped into
 */
export function canDrop(
  blocks: Readonly<Record<string, BuilderBlockDefinition>>,
  source: { get: (key: "type") => string | undefined } | undefined,
  target: { get: (key: "type") => string | undefined } | undefined
): boolean {
  const sourceType = source?.get("type") ?? "";
  const targetType = target?.get("type") ?? "wrapper";
  const sourceBlock = blocks[sourceType];
  const targetBlock = blocks[targetType];
  if (sourceBlock?.childOf && sourceBlock.childOf !== targetType) return false;
  if (targetBlock?.children && !targetBlock.children.includes(sourceType)) return false;
  if (targetBlock && !targetBlock.children && !targetBlock.droppable) return false;
  return true;
}

/** The GrapesJS component JSON a fresh drop of `block` contains. */
export function blockContent(block: BuilderBlockDefinition): ComponentJSON {
  return { type: block.type, components: block.initialChildren ?? [] };
}

/**
 * Builds the GrapesJS plugin that registers everything the page builder adds to the editor: the
 * React canvas renderer, the custom trait types, one component type and one palette block per
 * `BuilderBlockDefinition`, selection pruning and field visibility. Shell-agnostic: the Studio
 * SDK options (`studio-options.ts`) and the Core config (`core-config.ts`) install the same
 * plugin, so both editors save the same page format.
 *
 * `text`, `image` and `video` override GrapesJS's own types of those names on purpose: a page
 * holds the library's blocks only, so core's rich-text, image and video components never
 * appear in a stored tree.
 */
export const createBuilderPlugin =
  ({
    queryClient,
    blocks = BUILDER_BLOCK_LIST,
    canvasStyles = true,
  }: CreateBuilderPluginProps = {}) =>
  (editor: Editor) => {
    const byType: Record<string, BuilderBlockDefinition> = Object.fromEntries(
      blocks.map((block) => [block.type, block])
    );

    // The React canvas renderer: plugins run before the first frame is built, so the canvas
    // config is read with this in place.
    editor.Canvas.config.customRenderer = createCanvasRenderer(canvasRendererConfig, queryClient);
    if (canvasStyles) installCanvasStyles(editor);

    // Custom trait types must exist before any `addType` below names them in its traits.
    registerAllCustomTraitTypes(editor);
    installIdTrait(editor);
    registerFieldVisibility(editor);
    registerSelectionPruning(editor);

    const droppable = (source: Component, target: Component) => canDrop(byType, source, target);
    const draggable = (source: Component, target: Component) => canDrop(byType, source, target);

    blocks.forEach((block) => {
      editor.Components.addType(block.type, {
        // A block is only ever created by type (a palette drop or a stored `type`), never
        // recognised from HTML; `extend: "default"` keeps core's own `text`/`image` behaviour out.
        isComponent: () => false,
        extend: "default",
        extendView: "default",
        model: {
          defaults: {
            tagName: "div",
            name: block.label,
            attributes: { ...(block.defaults ?? {}) },
            traits: ["id", ...toTraits(block.fields)],
            draggable: block.childOf ? draggable : true,
            droppable: block.droppable || block.children?.length ? droppable : false,
            components: (block.initialChildren ?? []) as never,
          },
        },
      });
    });

    registerBuilderBlocks(editor, blocks);
  };

/**
 * Makes the palette hold exactly the library's blocks: removes every block first (the Studio
 * SDK adds its own default set, some with the same ids as ours, after plugins run), then adds
 * one block per definition with its icon.
 *
 * @param editor the live editor
 * @param blocks the library's blocks; the whole library by default
 */
export function registerBuilderBlocks(
  editor: Editor,
  blocks: readonly BuilderBlockDefinition[] = BUILDER_BLOCK_LIST
) {
  const byType = new Map(blocks.map((block) => [block.type, block]));
  // Removed even where the id matches: a same-id block added by the SDK keeps its own category
  // and content when added over.
  [...editor.Blocks.getAll().models].forEach((existing) =>
    editor.Blocks.remove(String(existing.getId()))
  );
  blocks.forEach((block) => {
    editor.Blocks.add(block.type, {
      label: block.label,
      category: block.category,
      content: blockContent(block),
      select: true,
    });
  });
  fillPaletteIconMarkup(editor, (id) => byType.get(id)?.icon);
}
