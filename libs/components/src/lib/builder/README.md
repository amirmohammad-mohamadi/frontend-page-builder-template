# Page builder blocks

The block library and the page renderer, imported as `@components/builder`. The admin editor
(GrapesJS) derives its component types, traits and palette from the same definitions the web app
renders from, so a block is written once.

## How a page is stored

A page is a GrapesJS component tree (`components: ComponentJSON[]`) plus its CSS. Every block is a
node whose `type` is the block's id and whose `attributes` hold its field values **as strings**.
One tree serves every language: a translatable attribute stores a locale record serialized as JSON,
`text = {"en":"Hello","fa":"سلام"}`. A plain string is read as the default-locale text, so a
hand-written seed can skip the record. `renderPageContent` sanitizes the tree and the CSS, then
renders each block for the request's locale with a fallback to the default locale.

## Adding a block

1. **Folder**: `blocks/<type>/index.tsx`, where `<type>` is the GrapesJS type id (`cta-banner`).
2. **Fields**: declare them with `defineFields([...])` (a `FieldDef` each: `name`, `label`, `type`,
   `category`, `default`, `options`, …). Mark visitor-facing texts `translatable: true` and give
   them a default through `sample(en, fa)` from `blocks/shared/defaults.ts`. Field names are the
   attribute names; avoid `style`, `class` and `id`, which GrapesJS owns.
3. **Component**: a function of `BlockProps` (`attributes`, `locale`, `defaultLocale`, `children`,
   `className`, `id`). Read typed values with `fieldsToProps(FIELDS, attributes, { locale, defaultLocale })`.
   Use `@components` primitives (Button, Card, Accordion, Separator), `cn` from `@utils`, theme
   tokens only, logical CSS (`ms-*`, `pe-*`, `text-start`) and `dir={textDirection(text)}` on
   author text. Add `"use client"` only when the component needs hooks or browser APIs; the renderer
   runs in React Server Components.
4. **Definition**: export `<Pascal>Block: BuilderBlockDefinition` with `type`, `label`, `category`,
   `icon` (a lucide name), `fields: [...FIELDS]`, `defaults: fieldDefaults(FIELDS)`, and for
   containers `droppable`, `children` (allowed child types), `childOf` and `initialChildren` (what a
   fresh drop contains).
5. **Register** it in `blocks/index.ts`: add it to `BUILDER_BLOCK_LIST` (palette order) and re-export
   it. `BUILDER_BLOCKS` and `TRANSLATABLE_FIELDS` follow automatically; add a case to
   `render-component.spec.tsx` if the block renders children in a special way.

Blocks never fetch: they render what the tree holds. Content that comes from an API belongs to the
app, which resolves it before rendering and passes it in through attributes or children.

## Renderer

- `renderComponent(node, { locale, defaultLocale, blocks?, key? })` renders one node. A registered
  type renders its block component; any other node is a plain element with a safe tag, the stored
  classes, a safe attribute allow-list and sanitized HTML content.
- `renderPageContent({ components, styles?, css? }, { locale, defaultLocale })` renders a page: a
  `<style>` with `sanitizeCss(css)` (or the stored rules compiled by `rulesToCss`) and the sections.
- `sanitizeBuilderTree`, `sanitizeCss` and `sanitizeHtml` (an allow-list sanitizer with no DOM
  dependency) neutralise stored XSS: scripts, `on*` handlers, `javascript:` URLs, `</style>` breakouts.

## Editor bridge

`setGjsEditor` / `getGjsEditor` publish the live editor from the admin; `isInBuilderCanvas` and
`preventCanvasLinkNavigation` let a block behave on the canvas (a link selects the block instead of
navigating). The `grapesjs` import here is type-only.
