"use client";

import type { Editor } from "grapesjs";
import type { RefObject } from "react";
import { useLayersPanel } from "./layers-panel.hook";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
  /** The slot core's LayersView is appended into; must be mounted before `grapesjs.init`. */
  slotRef: RefObject<HTMLDivElement | null>;
};

/**
 * The Layers tab body: core's default LayersView (expand/collapse, select and hover in both
 * directions with the canvas, rename on double-click, hide, drag reorder) inside the layers slot,
 * plus a lock toggle on every row. Styled by the layer rules in `theme.css`.
 */
export function LayersPanel({ editor, slotRef }: Props) {
  useLayersPanel({ editor });

  return <div ref={slotRef} data-builder-slot="layers" className="builder-layers-panel" />;
}
