<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Admin app

The root `AGENTS.md` is the canon; this file adds what is specific to `apps/admin`. Strings live
in `src/texts.ts` (English only, no translation layer), data comes from `@services` hooks called
in `*.hook.ts` files, components only render, UI primitives come from `@components`, CSS is
logical (`ms-*`, `pe-*`, `start-*`), errors go through `captureError`, never `console.*`.

## Page builder

### Where things live

| Path                                         | What                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/grapesjs/editor/builder-plugin.ts`      | The GrapesJS plugin both editors install: one component type and one palette block per `BuilderBlockDefinition`, the custom traits, selection pruning.        |
| `src/grapesjs/editor/core-config.ts`         | `getCoreEditorConfig`: the GrapesJS core `EditorConfig` of the bundled shell (no storage, no panels, canvas-scoped keymaps, style sectors).                   |
| `src/grapesjs/editor/studio-options.ts`      | `getStudioEditorOptions`: the Studio SDK options (self storage, media library as asset provider, the same plugin).                                            |
| `src/grapesjs/editor/canvas-styles.ts`       | Copies the admin document's stylesheets into every canvas frame, so blocks look like the site; sets the frame's `lang`/`dir` from the editing locale.         |
| `src/grapesjs/editor/editing-locale.ts`      | The module-level editing-locale store the traits, the canvas and the toolbar share.                                                                           |
| `src/grapesjs/editor/palette-icons.ts`       | The lucide icons the palette draws, by the `icon` name of a block definition (unknown names get a generic box; add a name here to give a new block its icon). |
| `src/grapesjs/fields/`                       | `toTraits` (block fields → GrapesJS traits) and the custom trait views: `translatable`, `file`, `href`, plus the `color`/`number`/`id` fixes.                 |
| `src/grapesjs/renderer/`                     | The React canvas renderer: one React root per canvas frame, every block drawn by its own component from `@components/builder`.                                |
| `src/features/builder/`                      | The editor route: toolbar, the Core shell (`editor-shell/`), the Studio host, load/save/publish (`builder-editor.hook.ts`), `page-project.ts`.                |
| `src/features/pages/`, `src/features/media/` | The pages table (create, open, publish/unpublish, delete) and the media library (upload, edit, delete).                                                       |
| `src/app/(builder)/builder/[id]/page.tsx`    | The full-screen editor route (client-only; `grapesjs` is loaded with `next/dynamic` and `ssr: false`).                                                        |

### Core versus Studio

`NEXT_PUBLIC_BUILDER_EDITOR=core` (default) mounts the bundled shell: GrapesJS core with our
own panels, no licence. `studio` mounts `@grapesjs/studio-sdk` with the project's
`NEXT_PUBLIC_GRAPESJS_LICENSE_KEY`. Without a key the Studio host is mounted only on localhost
(the SDK's development mode); anywhere else `resolveEditorKind` falls back to Core and the
toolbar shows a notice. Both editors install the same plugin, render the canvas with the same
renderer and save the same format, so a page is editable in either.

**Import restriction.** Only `src/features/builder/studio-host.tsx` and
`src/grapesjs/editor/studio-options.ts` may import `@grapesjs/studio-sdk` (the root ESLint
config does not enforce this; keep it by review). The host is loaded with `next/dynamic`, so a
Core-only deployment never bundles the SDK.

### Adding a block

Add it to `libs/components/src/lib/builder` (see that folder's `README.md`): a component, its
`defineFields([...])` and a `BuilderBlockDefinition` registered in `blocks/index.ts`. Nothing in
the admin changes: the plugin derives the component type, the traits (`toTraits`) and the
palette entry from the definition, and the renderer draws the block with its own component.
Optionally add the definition's lucide `icon` name to `palette-icons.ts`.

### Editing locale

Translatable fields store one JSON object per attribute, keyed by locale
(`{"en":"…","fa":"…"}`). The toolbar's language switcher writes `editing-locale.ts`; the
`translatable` trait edits that locale's text (the fallback text is the placeholder) and the
canvas renders it, falling back to `DEFAULT_CONTENT_LOCALE`. `CONTENT_LOCALES` in
`src/config/locale.ts` must match the web app's `apps/web/src/i18n/locales.ts`.

### Save format

`page-project.ts` converts both ways. Load: `editor.loadProjectData({ pages: [{ frames: [{
component: { type: "wrapper", components: draft.components } }] }], styles: draft.styles })`.
Save: `PATCH /api/v1/admin/pages/{id}` with `draft = { components: <the wrapper's children as
component JSON>, styles: editor.getProjectData().styles, css: editor.getCss({ avoidProtected:
true }) }` (`useUpdatePage`). Publish saves first when there are unsaved changes, then calls
`usePublishPage`; the unsaved indicator compares `buildDraftSignature(readDraft(editor))` with
the signature recorded at the last load or save.
Leaving with unsaved changes asks first: `beforeunload` for reloads and tab closes, a confirm on
the toolbar's "Back to pages" link for in-app navigation. The Studio host saves through the SDK's
`storage.onSave` (its save command and autosave) with the same `fromProjectData` conversion.

### Studio palette

The SDK adds its own default blocks (basic, forms, navbar, ...) after plugins run, replacing ours
where the ids match (`section`, `text`, `image`, ...). `studio-options.ts` therefore calls
`registerBuilderBlocks` once the editor is ready, which empties the palette and adds the
library's blocks again, so both editors offer exactly `BUILDER_BLOCKS`.

### Environment

| Variable                           | Default                 | What                                                                      |
| ---------------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BUILDER_EDITOR`       | `core`                  | `core` or `studio`.                                                       |
| `NEXT_PUBLIC_GRAPESJS_LICENSE_KEY` | empty                   | Your own Studio licence key (https://app.grapesjs.com); never committed.  |
| `NEXT_PUBLIC_WEB_APP_URL`          | `http://localhost:3000` | Where Preview opens `/<locale>/preview/<slug>` (signed-in draft preview). |

All three are validated in `src/env.ts`.
