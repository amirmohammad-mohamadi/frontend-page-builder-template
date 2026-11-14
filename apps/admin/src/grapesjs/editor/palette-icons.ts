import {
  BoxIcon,
  CircleHelpIcon,
  Columns3Icon,
  HeadingIcon,
  ImageIcon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  MegaphoneIcon,
  MessageCircleQuestionIcon,
  MinusIcon,
  MousePointerClickIcon,
  MoveVerticalIcon,
  RectangleVerticalIcon,
  SparklesIcon,
  SquareCheckIcon,
  TextIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

/**
 * The lucide icons the palette draws, by the kebab-case name a block definition's `icon`
 * carries. Imported one by one so the builder route pays only for these; a block that names an
 * icon missing here gets the generic box, so adding one is optional (the lucide site lists the
 * names).
 */
export const PALETTE_ICONS: Readonly<Record<string, LucideIcon>> = {
  "layout-template": LayoutTemplateIcon,
  "columns-3": Columns3Icon,
  "rectangle-vertical": RectangleVerticalIcon,
  "move-vertical": MoveVerticalIcon,
  minus: MinusIcon,
  heading: HeadingIcon,
  text: TextIcon,
  "mouse-pointer-click": MousePointerClickIcon,
  "message-circle-question": MessageCircleQuestionIcon,
  "circle-help": CircleHelpIcon,
  image: ImageIcon,
  video: VideoIcon,
  sparkles: SparklesIcon,
  "layout-grid": LayoutGridIcon,
  "square-check": SquareCheckIcon,
  megaphone: MegaphoneIcon,
};

/** The icon drawn for an unknown or missing name. */
export const FALLBACK_PALETTE_ICON: LucideIcon = BoxIcon;

/** The palette icon for a block definition's `icon` name. */
export function paletteIcon(name: string | undefined): LucideIcon {
  return (name && PALETTE_ICONS[name]) || FALLBACK_PALETTE_ICON;
}

const markupCache = new Map<string, string>();

/**
 * The static SVG markup of a palette icon, for GrapesJS block `media` (the string the Studio
 * SDK's block panel draws; the Core palette draws the React icon itself). Rendered once per
 * name into a detached element with `flushSync`, so it must run outside React's own render
 * and effects (see `fillPaletteIconMarkup`).
 *
 * @param name the block definition's `icon`
 */
export function paletteIconMarkup(name: string | undefined): string {
  const key = name && PALETTE_ICONS[name] ? name : "";
  const cached = markupCache.get(key);
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return "";

  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() => {
    root.render(createElement(paletteIcon(name), { "aria-hidden": true }));
  });
  const markup = host.innerHTML;
  root.unmount();
  markupCache.set(key, markup);
  return markup;
}

/**
 * Gives every registered block its icon markup as `media`, one task later: the plugin runs
 * inside the shell's mount effect, where React refuses `flushSync`, so the blocks are
 * registered without media and filled in once React is idle. Core re-reads the palette on
 * `block:custom`.
 *
 * @param editor the editor whose blocks are filled
 * @param iconOf the icon name of a block, by block id
 */
export function fillPaletteIconMarkup(
  editor: {
    Blocks: {
      getAll: () => {
        models: { getId: () => string; set: (key: "media", value: string) => void }[];
      };
    };
    em: { destroyed?: boolean };
  },
  iconOf: (id: string) => string | undefined
): void {
  setTimeout(() => {
    if (editor.em.destroyed) return;
    editor.Blocks.getAll().models.forEach((block) => {
      block.set("media", paletteIconMarkup(iconOf(block.getId())));
    });
  }, 0);
}
