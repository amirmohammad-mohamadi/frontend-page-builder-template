import type { Editor } from "grapesjs";

/**
 * The live GrapesJS editor, published by the admin app once it is ready so
 * block components can tell the canvas from a visitor's page. The web app
 * never sets it.
 */
let currentEditor: Editor | null = null;

/**
 * Publishes (or clears, with `null`) the live editor.
 *
 * @param editor the GrapesJS editor instance
 */
export function setGjsEditor(editor: Editor | null): void {
  currentEditor = editor;
}

/** The live editor, or `null` outside the admin editor. */
export function getGjsEditor(): Editor | null {
  return currentEditor;
}

/**
 * True when `el` is mounted inside the GrapesJS canvas, where clicking a link
 * must select the block instead of navigating the editor away. Works before
 * the editor handshake too: GrapesJS renders the canvas in an
 * `<iframe class="gjs-frame">` inside `.gjs-cv-canvas`.
 *
 * @param el an element of the block
 */
export function isInBuilderCanvas(el: Element | null | undefined): boolean {
  if (getGjsEditor()) return true;
  try {
    const frame = el?.ownerDocument?.defaultView?.frameElement as HTMLElement | null | undefined;
    if (!frame) return false;
    return frame.classList.contains("gjs-frame") || !!frame.closest(".gjs-cv-canvas");
  } catch {
    // A cross-origin embed is not our editor.
    return false;
  }
}

/** The part of a click event `preventCanvasLinkNavigation` reads. */
export type CanvasClickEvent = {
  target: EventTarget | null;
  currentTarget: Element;
  preventDefault: () => void;
};

/**
 * `onClickCapture` for a block that contains links: on the builder canvas a
 * click on a link inside it does not navigate (the editor selects the block).
 *
 * @param event the React click event
 */
export function preventCanvasLinkNavigation(event: CanvasClickEvent): void {
  // Duck-typed: the canvas lives in an iframe, whose elements fail `instanceof Element` here.
  const target = event.target as Partial<Element> | null;
  const link = target && typeof target.closest === "function" ? target.closest("a[href]") : null;
  if (link && isInBuilderCanvas(event.currentTarget)) event.preventDefault();
}
