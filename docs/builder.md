# Page builder

Operators compose pages in the admin app (`/builder/[id]`) with GrapesJS; the web app renders the published copy with React and no GrapesJS at all. Both sides read the same block library, so a block is defined once.

## The pieces

```
block definition (libs/components/src/lib/builder/blocks/<type>/)
   ├─ admin: builder-plugin.ts → one GrapesJS component type + one palette block
   │         toTraits(fields)  → the traits panel
   │         canvas renderer   → the block's React component inside the canvas frame
   └─ web:   renderPageContent → the same React component on the server, props from the attributes
```

| Path                                                    | What                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `libs/components/src/lib/builder/blocks/`               | one folder per block (component + `defineFields([...])` + `BuilderBlockDefinition`), `index.ts` registry |
| `libs/components/src/lib/builder/render-component.tsx`  | `renderComponent` / `renderPageContent`, used by the web app and the canvas                              |
| `libs/components/src/lib/builder/translatable-texts.ts` | per-locale attribute values and their fallback                                                           |
| `libs/components/src/lib/builder/sanitize/`             | `sanitizeBuilderTree`, `sanitizeCss`, `sanitizeHtml`                                                     |
| `libs/components/src/lib/builder/editor-bridge.ts`      | `setGjsEditor` / `getGjsEditor`, `isInBuilderCanvas`, `preventCanvasLinkNavigation`                      |
| `apps/admin/src/grapesjs/editor/`                       | the plugin, Core config, keymaps, style sectors, canvas styles, editing locale, Studio options           |
| `apps/admin/src/grapesjs/fields/`                       | `toTraits` and the custom traits (`translatable`, `file`, `href`, `color`, `number`, `id`)               |
| `apps/admin/src/grapesjs/renderer/`                     | the React canvas renderer                                                                                |
| `apps/admin/src/features/builder/`                      | the editor route: toolbar, Core shell, Studio host, load/save/publish, `page-project.ts`                 |
| `apps/admin/src/features/pages/`, `features/media/`     | the pages table and the media library                                                                    |
| `apps/web/src/app/[locale]/[...slug]/`                  | the published page                                                                                       |
| `apps/web/src/app/[locale]/preview/[...slug]/`          | the draft preview for a signed-in user                                                                   |

`apps/admin/AGENTS.md` (section "Page builder") and `apps/web/AGENTS.md` (section "Builder pages") hold the file-level detail.

## Blocks

A block is one React component plus a list of field definitions. The fields become GrapesJS traits in the editor (`toTraits`) and typed props on the site (`fieldsToProps`). The shipped set: `section`, `columns` + `column`, `heading`, `text`, `image`, `button`, `hero`, `feature-grid` + `feature-card`, `faq` + `faq-item`, `cta-banner`, `divider`, `video`, `spacer`. Blocks never fetch; data from an API is resolved by the app and passed in through attributes or children.

### Adding a block

1. Create `libs/components/src/lib/builder/blocks/<type>/index.tsx`; `<type>` is the GrapesJS type id.
2. Declare the fields with `defineFields([...])`. Mark visitor-facing texts `translatable: true` with a default from `sample(en, fa)` (`blocks/shared/defaults.ts`). Do not name a field `style`, `class` or `id`.
3. Write the component as a function of `BlockProps`; read values with `fieldsToProps(FIELDS, attributes, { locale, defaultLocale })`. Use `@components` primitives, theme tokens and logical CSS only. Add `"use client"` only when it needs hooks or browser APIs.
4. Export `<Pascal>Block: BuilderBlockDefinition` (`type`, `label`, `category`, `icon`, `fields`, `defaults`, and for containers `droppable`, `children`, `childOf`, `initialChildren`).
5. Add it to `BUILDER_BLOCK_LIST` in `blocks/index.ts` and re-export it.
6. Optionally map its lucide `icon` name in `apps/admin/src/grapesjs/editor/palette-icons.ts`.

Nothing else changes in either app. The full checklist is in `libs/components/src/lib/builder/README.md`.

## Translatable texts and the editing locale

One tree serves every language. A translatable attribute stores a JSON string keyed by locale, `text = {"en":"Hello","fa":"سلام"}`; a plain string is read as the default-locale text. The renderer picks the request's locale and falls back to the default locale.

In the editor, the toolbar's language switcher sets the editing locale (`apps/admin/src/grapesjs/editor/editing-locale.ts`). The `translatable` trait edits that locale's value (the fallback shows as placeholder), and the canvas renders it with the frame's `lang` and `dir` set accordingly, so right-to-left content is edited right-to-left.

### Adding a content locale

1. Web app: add the code to `LOCALES` in `apps/web/src/i18n/locales.ts` and add `apps/web/messages/<code>.json`.
2. Admin app: add the same code to `CONTENT_LOCALES` and `CONTENT_LOCALE_LABELS` in `apps/admin/src/config/locale.ts`. The two lists must match, and `DEFAULT_CONTENT_LOCALE` must match the web app's default.
3. Optionally give the block defaults a text for it (`blocks/shared/defaults.ts`); existing pages fall back to the default locale until translated.

## Save format

The editor saves the page's `draft` as `{ components, styles, css }`: the wrapper's children as GrapesJS component JSON, the CssRule JSON, and the compiled CSS so the web app renders without GrapesJS. `apps/admin/src/features/builder/page-project.ts` converts between that and GrapesJS project data. Saving is `PATCH /api/v1/admin/pages/{id}` with `draft`; publishing copies the draft to `published`, which is what visitors see. Unpublishing clears `published`; the draft stays. The record and routes are specified in [pages-api.md](pages-api.md) and [openapi.yaml](openapi.yaml).

## Canvas renderer

GrapesJS core's `CanvasConfig.customRenderer` lets the admin mount one React root per canvas frame (`apps/admin/src/grapesjs/renderer/canvas-renderer.tsx`). Each registered block is drawn by its own component from `@components/builder`, so the canvas looks like the site; `canvas-styles.ts` copies the admin's stylesheets into the frame. Both editors use this renderer.

## Security

- **On render**: `renderPageContent` runs `sanitizeBuilderTree`, `sanitizeCss` and `sanitizeHtml` (allow-lists, no DOM dependency) over stored content: scripts, `on*` handlers, `javascript:` URLs and `</style>` breakouts are removed. Unregistered nodes render with a safe tag and an attribute allow-list. Stored content is treated as untrusted even though only operators write it.
- **Proxy allow-list**: the BFF proxy forwards only the prefixes in `WEB_PROXY_PREFIXES` / `ADMIN_PROXY_PREFIXES` with the session token; anything else answers 404 before it reaches the backend. `/api/v1/pages` is in both lists for the preview; `/api/v1/admin` covers pages and media in the admin.
- The draft preview is a protected route of the web app and is never indexed.

## The mock API

`tools/mock-api/server.mjs` implements every page and media route (see [pages-api.md](pages-api.md#how-the-mock-behaves)): admin routes need the `admin@example.com` token, the public route answers only published pages, the preview needs any signed-in token. Pages and media persist to `tools/mock-api/data/*.json` (gitignored); without them the committed `tools/mock-api/seed/pages.json` provides the published `about` page. Uploads go to `tools/mock-api/uploads/` and are served at `/uploads/<file>`. `npm run mock-api:smoke` exercises the routes on an isolated instance.

Limits: it is for development only. Tokens are unsigned, there is a single process with no locking, uploads are capped at 25 MiB with image dimensions read only for PNG, GIF and JPEG, and nothing is validated beyond what the apps need. Replace it by pointing the env at a real backend.
