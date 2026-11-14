"use client";

import type { Editor } from "grapesjs";
import { EyeOffIcon } from "lucide-react";
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components";
import { TEXTS } from "@/texts";
import "grapesjs/dist/css/grapes.min.css";
import "./theme.css";
import { useEditorShell, type LeftTab, type RightTab } from "./index.hook";
import { AssetPickerDialog } from "./panels/asset-picker-dialog";
import { BlocksPanel } from "./panels/blocks-panel";
import { LayersPanel } from "./panels/layers-panel";
import { StylesPanel } from "./panels/styles-panel";
import { TopBar } from "./panels/top-bar";
import { TraitsPanel } from "./panels/traits-panel";

type Props = {
  /** Called once, synchronously after `grapesjs.init`, with the new editor. */
  onEditor: (editor: Editor) => void;
};

/**
 * The GrapesJS core editor shell: Blocks | Layers tabs on the left, a top bar over the canvas in
 * the centre, Properties | Styles tabs on the right. Core mounts its default Traits, Layers,
 * Styles and Selectors views into the slot elements rendered here. During core's preview
 * everything marked `data-shell-chrome` is hidden (see `theme.css`).
 */
export function EditorShell({ onEditor }: Props) {
  const t = TEXTS.builder.shell;
  const vm = useEditorShell({ onEditor });

  return (
    <div
      data-preview={vm.preview || undefined}
      className="builder-editor-shell bg-background text-foreground min-h-0 w-full flex-1 overflow-hidden"
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel data-shell-chrome defaultSize={18} minSize={12} maxSize={30}>
          <Tabs
            value={vm.leftTab}
            onValueChange={(value) => vm.setLeftTab(value as LeftTab)}
            className="h-full min-h-0 gap-0"
          >
            <div className="shrink-0 border-b p-2">
              <TabsList className="w-full">
                <TabsTrigger value="blocks">{t.tabBlocks}</TabsTrigger>
                <TabsTrigger value="layers">{t.tabLayers}</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="blocks" className="min-h-0 overflow-y-auto">
              <BlocksPanel editor={vm.editor} />
            </TabsContent>
            {/* Force-mounted: core appends its Layers view into this slot once, at init. */}
            <TabsContent
              value="layers"
              forceMount
              className="min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            >
              <LayersPanel editor={vm.editor} slotRef={vm.layersRef} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle data-shell-chrome />

        <ResizablePanel defaultSize={62} minSize={30}>
          <div className="relative flex h-full min-h-0 flex-col">
            <div data-shell-chrome className="flex h-10 shrink-0 items-center gap-2 border-b px-2">
              <TopBar editor={vm.editor} />
            </div>
            <div
              ref={vm.containerRef}
              aria-label={t.canvasLabel}
              data-builder-slot="canvas"
              className="relative min-h-0 flex-1"
            />
            {vm.preview ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute end-3 top-3 z-10 shadow-md"
                onClick={vm.exitPreview}
              >
                <EyeOffIcon />
                {t.exitPreview}
              </Button>
            ) : null}
          </div>
        </ResizablePanel>

        <ResizableHandle data-shell-chrome />

        <ResizablePanel data-shell-chrome defaultSize={20} minSize={16} maxSize={35}>
          <Tabs
            value={vm.rightTab}
            onValueChange={(value) => vm.setRightTab(value as RightTab)}
            className="h-full min-h-0 gap-0"
          >
            <div className="shrink-0 border-b p-2">
              <TabsList className="w-full">
                <TabsTrigger value="properties">{t.tabProperties}</TabsTrigger>
                <TabsTrigger value="styles">{t.tabStyles}</TabsTrigger>
              </TabsList>
            </div>
            {/* Force-mounted: core appends its views into these slots once, at init. */}
            <TabsContent
              value="properties"
              forceMount
              className="min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            >
              <TraitsPanel editor={vm.editor} slotRef={vm.traitsRef} />
            </TabsContent>
            <TabsContent
              value="styles"
              forceMount
              className="min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            >
              <StylesPanel
                editor={vm.editor}
                selectorsRef={vm.selectorsRef}
                stylesRef={vm.stylesRef}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>

      <AssetPickerDialog controller={vm.assetPicker} />
    </div>
  );
}
