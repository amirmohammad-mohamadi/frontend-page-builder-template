import type { Editor } from "grapesjs";
import { captureError, isRtlLocale } from "@utils";
import { getEditingLocale, subscribeEditingLocale } from "./editing-locale";

/**
 * How the canvas gets the site's look. Next.js emits the app's compiled Tailwind CSS (the
 * shared theme tokens and every block class) as `<link rel="stylesheet">` tags and, in
 * development, sometimes as inline `<style>` tags whose hrefs change on every build. There is
 * no stable URL to point the canvas at, so the stylesheets of the admin document itself are
 * copied into each canvas frame: same-origin `<link href>`s as links, inline sheets as one
 * `<style>`. The admin imports the same `globals.css` as the web app's theme, so a block on the
 * canvas is drawn by the very rules the public page uses.
 */

/** The id of the `<style>` holding the copied inline rules, so a reload replaces it. */
const INLINE_STYLE_ID = "pb-canvas-inline-css";

/** The marker on the copied `<link>` tags. */
const LINK_MARKER = "data-pb-canvas-css";

/** Styles the canvas itself needs: the bound wrapper element of every block is block-level. */
const CANVAS_BASE_CSS = `
  gjs-wrapper { display: block; }
  body { min-height: 100vh; }
  [data-gjs-type="wrapper"] { min-height: 100vh; }
`;

/** The stylesheets of the admin document: same-origin link hrefs and the text of inline sheets. */
export function collectDocumentStyles(doc: Document = document): {
  links: string[];
  inlineCss: string;
} {
  const links: string[] = [];
  let inlineCss = "";
  Array.from(doc.styleSheets).forEach((sheet) => {
    if (sheet.href) {
      // Only this origin's sheets: a cross-origin link is not the app's CSS.
      try {
        if (new URL(sheet.href, doc.baseURI).origin === doc.location.origin) links.push(sheet.href);
      } catch {
        // An unreadable href is skipped.
      }
      return;
    }
    const owner = sheet.ownerNode as HTMLElement | null;
    // The editor's own stylesheets (grapes.min.css, the shell theme) stay out of the page.
    if (owner?.textContent?.includes("--gjs-")) return;
    try {
      Array.from(sheet.cssRules).forEach((rule) => {
        inlineCss += `${rule.cssText}\n`;
      });
    } catch {
      // A sheet the document may not read is skipped.
    }
  });
  return { links, inlineCss };
}

/** Writes the admin document's styles and the base canvas CSS into one frame document. */
function injectInto(frameDocument: Document): void {
  const head = frameDocument.head;
  if (!head) return;
  const { links, inlineCss } = collectDocumentStyles();

  head.querySelectorAll(`[${LINK_MARKER}]`).forEach((node) => node.remove());
  links.forEach((href) => {
    const link = frameDocument.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(LINK_MARKER, "");
    head.appendChild(link);
  });

  let style = frameDocument.getElementById(INLINE_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = frameDocument.createElement("style");
    style.id = INLINE_STYLE_ID;
    head.appendChild(style);
  }
  style.textContent = `${CANVAS_BASE_CSS}\n${inlineCss}`;
}

/**
 * Sets a frame's `lang` and `dir` from the editing locale. The canvas always renders the
 * page's light theme (what a visitor sees by default), whatever theme the admin itself uses.
 */
function syncFrameDocument(frameDocument: Document): void {
  const html = frameDocument.documentElement;
  const locale = getEditingLocale();
  html.lang = locale;
  html.dir = isRtlLocale(locale) ? "rtl" : "ltr";
}

/**
 * Keeps every canvas frame styled like the site: copies the admin document's stylesheets into
 * a frame once core has rendered its head (`canvas:frame:load:head`; the plain load event
 * fires before core rewrites the head), and sets the frame's `lang` and `dir` from the editing
 * locale (so a Persian page is laid out right-to-left on the canvas).
 *
 * @param editor the editor whose frames are styled
 */
export function installCanvasStyles(editor: Editor): void {
  const frameDocuments = (): Document[] =>
    editor.Canvas.getFrames()
      .map((frame) => frame.view?.el?.contentDocument ?? null)
      .filter((doc): doc is Document => !!doc);

  const onFrameLoad = ({ window: frameWindow }: { window?: Window }) => {
    const doc = frameWindow?.document;
    if (!doc) return;
    try {
      injectInto(doc);
      syncFrameDocument(doc);
    } catch (error) {
      captureError(error, { area: "builder-canvas-styles" });
    }
  };
  editor.on(editor.Canvas.events.frameLoadHead, onFrameLoad);

  const unsubscribeLocale = subscribeEditingLocale(() =>
    frameDocuments().forEach(syncFrameDocument)
  );

  editor.on("destroy", () => {
    editor.off(editor.Canvas.events.frameLoadHead, onFrameLoad);
    unsubscribeLocale();
  });
}
