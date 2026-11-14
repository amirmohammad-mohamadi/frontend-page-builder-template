import type { EditorConfig } from "grapesjs";
import type { QueryClient } from "@tanstack/react-query";
import type { CoreAssetPickerHooks } from "./asset-picker-controller";
import { createBuilderPlugin } from "./builder-plugin";
import { CANVAS_SCOPED_KEYMAPS } from "./core-keymaps";
import { CORE_STYLE_SECTORS } from "./core-style-sectors";

/**
 * Core's own `protectedCss` default (grapesjs 0.22.16), pinned so a core upgrade cannot change
 * the CSS every canvas frame starts with. Left out of the saved CSS (`getCss({ avoidProtected })`).
 */
export const CORE_PROTECTED_CSS = "* { box-sizing: border-box; } body {margin: 0;}";

/** Elements the shell owns, into which core mounts its default panel views. */
export type CoreEditorSlots = {
  traits?: HTMLElement;
  layers?: HTMLElement;
  styles?: HTMLElement;
  selectors?: HTMLElement;
};

export type GetCoreEditorConfigProps = {
  /** Element (or selector) the canvas mounts into. */
  container: HTMLElement | string;
  /** The host's React Query client, handed to the canvas renderer. */
  queryClient?: QueryClient;
  /** Shell-owned mount points for the Traits, Layers, Styles and Selectors views. */
  slots?: CoreEditorSlots;
  /** Media picker the Asset Manager opens; core's modal is used when omitted. */
  assetPicker?: CoreAssetPickerHooks;
};

/**
 * Builds the GrapesJS core `EditorConfig` for the licence-free builder shell: no storage (the
 * route loads and saves through `@services`), no default panels (the shell draws its own), no
 * icon-font CDN, no telemetry, core's parser and CSS defaults pinned, the canvas-scoped
 * keymaps, the style sectors and the shared builder plugin.
 */
export const getCoreEditorConfig = ({
  container,
  queryClient,
  slots = {},
  assetPicker,
}: GetCoreEditorConfigProps): EditorConfig => ({
  container,
  fromElement: false,
  height: "100%",
  width: "auto",
  storageManager: false,
  panels: { defaults: [] },
  showDevices: false,
  // Core appends the Font Awesome CDN stylesheet whenever this is truthy.
  cssIcons: "",
  // Core posts a telemetry beacon on every non-localhost host by default.
  telemetry: false,
  protectedCss: CORE_PROTECTED_CSS,
  traitManager: { appendTo: slots.traits },
  layerManager: { appendTo: slots.layers },
  styleManager: { appendTo: slots.styles, sectors: CORE_STYLE_SECTORS },
  selectorManager: { appendTo: slots.selectors, componentFirst: true },
  blockManager: { custom: true },
  keymaps: { defaults: CANVAS_SCOPED_KEYMAPS },
  // Core puts every selection change on the undo stack by default; Undo takes back edits only.
  undoManager: { trackSelection: false },
  assetManager: assetPicker
    ? { custom: { open: assetPicker.open, close: assetPicker.close }, showUrlInput: false }
    : {},
  plugins: [createBuilderPlugin({ queryClient })],
});
