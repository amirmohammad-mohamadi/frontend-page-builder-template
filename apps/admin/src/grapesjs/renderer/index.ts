import type { ComponentType } from "react";
import { BUILDER_BLOCKS, type BlockProps } from "@components/builder";

/** One entry of the canvas renderer's map: the React component of a block and its wrapper style. */
export type CanvasRendererComponent = {
  /** Rendered inside the `<gjs-wrapper>` element the GrapesJS view is bound to. */
  component: ComponentType<BlockProps>;
  /**
   * Inline style applied to the `<gjs-wrapper>` element itself (it, not the React component's
   * root, is the flex/grid item inside a parent block). Numeric values are written verbatim.
   */
  wrapperStyle?: React.CSSProperties;
};

/** The map the canvas renderer reads: block type id → component. */
export type CanvasRendererConfig = {
  components: Record<string, CanvasRendererComponent>;
};

/**
 * The canvas renderer's map, derived from the block library: every `BuilderBlockDefinition`
 * renders on the canvas with the same component the web app renders it with, so a block is
 * written once. Adding a block to `libs/components/src/lib/builder` adds it here.
 */
export const canvasRendererConfig: CanvasRendererConfig = {
  components: Object.fromEntries(
    Object.values(BUILDER_BLOCKS).map((block) => [
      block.type,
      { component: block.component, wrapperStyle: block.wrapperStyle },
    ])
  ),
};
