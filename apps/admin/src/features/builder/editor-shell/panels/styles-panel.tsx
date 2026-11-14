"use client";

import type { Editor } from "grapesjs";
import { PaletteIcon } from "lucide-react";
import type { RefObject } from "react";
import { TEXTS } from "@/texts";
import { useStylesPanel } from "./styles-panel.hook";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
  /** The slot core's selector view is appended into; must be mounted before `grapesjs.init`. */
  selectorsRef: RefObject<HTMLDivElement | null>;
  /** The slot core's StyleManager view is appended into; must be mounted before `grapesjs.init`. */
  stylesRef: RefObject<HTMLDivElement | null>;
};

/**
 * The Styles tab body: core's default selector bar (classes, state, `componentFirst`) above
 * core's StyleManager sectors (`CORE_STYLE_SECTORS`), or a "Select a block" state while
 * nothing is selected.
 */
export function StylesPanel({ editor, selectorsRef, stylesRef }: Props) {
  const t = TEXTS.builder.shell;
  const vm = useStylesPanel({ editor, selectorsRef });

  return (
    <div className="builder-styles-panel">
      {!vm.hasSelection ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center" role="status">
          <PaletteIcon className="text-muted-foreground size-6" aria-hidden />
          <p className="text-sm font-medium">{t.stylesNoSelectionTitle}</p>
          <p className="text-muted-foreground text-xs">{t.stylesNoSelectionBody}</p>
        </div>
      ) : null}
      {/* Always mounted: core appends its views here once, at init, and re-renders inside them. */}
      <div hidden={!vm.hasSelection}>
        <div ref={selectorsRef} data-builder-slot="selectors" />
        <div ref={stylesRef} data-builder-slot="styles" />
      </div>
    </div>
  );
}
