# Studio SDK (optional)

The admin app can mount the [GrapesJS Studio SDK](https://github.com/GrapesJS/studio) (`@grapesjs/studio-sdk`) instead of the bundled Core shell. It installs the same builder plugin, uses the same canvas renderer and media library, and saves the same `{ components, styles, css }` draft, so pages move freely between the two editors. Core stays the default.

## Licence

GrapesJS core is BSD-3-Clause. The Studio SDK is licensed under its own commercial terms (`node_modules/@grapesjs/studio-sdk/LICENSE.md`, https://github.com/GrapesJS/studio/blob/main/LICENSE.md). Keys come from a GrapesJS Studio account at https://app.grapesjs.com. The template ships no key and never will.

## Environment

| Variable                           | Default | What                                                        |
| ---------------------------------- | ------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_BUILDER_EDITOR`       | `core`  | `core` or `studio`                                          |
| `NEXT_PUBLIC_GRAPESJS_LICENSE_KEY` | empty   | your own Studio licence key; keep it out of committed files |

Both are validated in `apps/admin/src/env.ts`. Locally, set them in `.env`. In production, set them in the hosting platform's environment (or as `--build-arg` for the `Dockerfile`) before the build: `NEXT_PUBLIC_*` values are inlined by `next build`, so a change needs a rebuild. Being `NEXT_PUBLIC_*`, the key ends up in the admin's browser bundle; the SDK licence is bound to the hosts it runs on.

## Which editor is mounted

`resolveEditorKind` (`apps/admin/src/features/builder/editor-kind.ts`) decides from the configured editor, the key and `location.hostname`. Local hosts are `localhost`, `127.0.0.1` and `[::1]`, where the SDK runs in its development mode without a key.

| `NEXT_PUBLIC_BUILDER_EDITOR` | Host       | Key   | Mounted | Notice |
| ---------------------------- | ---------- | ----- | ------- | ------ |
| `core`                       | any        | any   | Core    | no     |
| `studio`                     | local host | empty | Studio  | no     |
| `studio`                     | local host | set   | Studio  | no     |
| `studio`                     | other host | set   | Studio  | no     |
| `studio`                     | other host | empty | Core    | yes    |

The notice (`TEXTS.builder.studioNotice` in `apps/admin/src/texts.ts`) is a status bar under the builder toolbar (`builder-editor.tsx`) saying the key is missing.

## Which files import the SDK

Only two modules may import `@grapesjs/studio-sdk` (kept by review; ESLint does not enforce it):

- `apps/admin/src/features/builder/studio-host.tsx`: the React host (`StudioEditor`), the SDK stylesheet, the editor bridge (`setGjsEditor`), options memoised on the page id.
- `apps/admin/src/grapesjs/editor/studio-options.ts`: `getStudioEditorOptions`, which builds the SDK options.

`builder-editor.tsx` loads the host with `next/dynamic`, so a Core-only deployment never bundles the SDK.

## How the options are built

- **GrapesJS**: `gjsScript` is the locally installed `grapesjs` (no CDN copy).
- **Storage**: `storage.type = "self"` with the page's draft as `project`; `onSave` (the save command, and autosave after 50 changes) converts the project data with `fromProjectData` from `page-project.ts` and saves through the same `saveDraft` the Core shell uses. `pages: false`: one page per editor; the pages list owns creation, slugs and publishing.
- **Assets**: `toStudioAssetsConfig` routes uploads and a "Media library" provider tab through the shared media library provider (`asset-provider.ts`); deleting stays on the admin's Media page.
- **Palette re-registration**: the SDK adds its own default blocks after plugins run and replaces ours where ids match (`section`, `text`, `image`, ...). A second plugin calls `registerBuilderBlocks(editor)` on `editor.onReady`, which empties the palette and adds the library's blocks again, so both editors offer exactly `BUILDER_BLOCKS`.

## Removing the SDK entirely

For a project that will never use Studio:

1. `npm uninstall @grapesjs/studio-sdk`.
2. Delete `apps/admin/src/features/builder/studio-host.tsx` and `apps/admin/src/grapesjs/editor/studio-options.ts`.
3. In `apps/admin/src/features/builder/builder-editor.tsx`, remove the dynamic `StudioHost` import, the notice and the Studio branch; in `builder-page.hook.ts`, drop `resolveEditorKind`. Then delete `editor-kind.ts`, its spec and `TEXTS.builder.studioNotice`.
4. Drop `NEXT_PUBLIC_BUILDER_EDITOR` and `NEXT_PUBLIC_GRAPESJS_LICENSE_KEY` from `apps/admin/src/env.ts` and `.env.example`.
5. Run `npm run check`.
