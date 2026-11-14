import type { StyleManagerConfig } from "grapesjs";

/**
 * The Styles tab of the Core shell: eight sectors built only from GrapesJS core's built-in
 * properties (grapesjs 0.22.16 PropertyFactory). Padding, margin and border-radius are
 * detached, so an edit writes the longhand (`padding-top: 10px`) instead of the four-value
 * shorthand.
 */
export const CORE_STYLE_SECTORS: NonNullable<StyleManagerConfig["sectors"]> = [
  {
    id: "layout",
    name: "Layout",
    open: false,
    properties: [
      "display",
      "flex-direction",
      "justify-content",
      "align-items",
      "flex-wrap",
      "align-content",
      "align-self",
      "order",
      "flex-grow",
      "flex-shrink",
      "flex-basis",
    ],
  },
  {
    id: "size",
    name: "Size",
    open: false,
    properties: ["width", "min-width", "max-width", "height", "min-height", "max-height"],
  },
  {
    id: "space",
    name: "Space",
    open: false,
    properties: [
      { extend: "padding", detached: true },
      { extend: "margin", detached: true },
    ],
  },
  {
    id: "position",
    name: "Position",
    open: false,
    properties: ["position", "top", "right", "bottom", "left"],
  },
  {
    id: "typography",
    name: "Typography",
    open: false,
    properties: [
      "font-family",
      "color",
      "font-size",
      "font-weight",
      "line-height",
      "letter-spacing",
      "text-align",
    ],
  },
  {
    id: "background",
    name: "Background",
    open: false,
    properties: ["background", "background-color"],
  },
  {
    id: "borders",
    name: "Borders",
    open: false,
    properties: [
      { extend: "border-radius", detached: true },
      "border-width",
      "border-style",
      "border-color",
    ],
  },
  {
    id: "effects",
    name: "Effects",
    open: false,
    properties: [
      "opacity",
      "cursor",
      "box-shadow",
      "text-shadow",
      "transition",
      "transform",
      "perspective",
    ],
  },
];
