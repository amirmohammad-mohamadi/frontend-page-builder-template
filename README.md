# Frontend Page Builder Template

A Next.js starting point for sites whose pages are built visually: a public web app and an admin app in one Nx workspace, where operators compose pages in a visual page builder on [GrapesJS](https://grapesjs.com) and the web app renders them. Every block is a plain React component with field definitions, shared by the editor canvas and the public site, so a block is written once. The services layer is backend-agnostic (a mock API ships for development and a documented contract describes what a real backend implements). The bundled GrapesJS Core editor is the default and needs no licence; the GrapesJS Studio SDK can be switched on with your own key.

## Quick start

```bash
npm install
cp .env.example .env        # defaults already point at the mock API
npm run dev                 # mock API :4000, web :3000, admin :3001
```

Accounts (password `password` for both): `admin@example.com` on the admin app, `user@example.com` on the web app.

- Admin, http://localhost:3001: `/pages` (create, open, publish, delete pages), `/media` (media library), `/builder/[id]` (the editor for one page).
- Web, http://localhost:3000: `/en/about` (the seeded published page, also `/fa/about` right-to-left), `/en/preview/<slug>` (the draft of any page for a signed-in user).

Individual servers: `npm run mock-api`, `npm run web`, `npm run admin`.

## What is inside

```
apps/
  web/        public app: next-intl (en + fa), RTL, theme, auth, published pages and draft preview
  admin/      operator app: sidebar shell, pages list, media library, the page builder (Core + optional Studio)
libs/
  components/ shadcn/ui primitives + the shared Tailwind theme
    src/lib/builder/  block library, page renderer, sanitizers (@components/builder)
  services/   apiClient, backend adapter, query hooks (incl. page and media), BFF auth server factory
  dtos/       Zod schemas and inferred types (incl. the page and media contracts)
  models/     thin domain classes over API records
  enums/      shared const enums
  utils/      pure helpers: cn, formatting, URL, text direction, env validation, error reporting
  assets/     placeholder logo
tools/
  mock-api/   dependency-free mock backend; pages and media persist to data/, uploads to uploads/
  generators/ `nx g ./tools/generators:domain <name>`
  scripts/    check-words gate, example removal
e2e/          Playwright smoke tests over both apps
docs/         architecture, builder, Studio SDK, pages API, auth, backend adapter, environment, generator
```

## Daily commands

| Command                                           | What it does                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run dev`                                     | all three dev servers                                             |
| `npm run check`                                   | lint, tools lint, typecheck, unit tests, word gate, format check  |
| `npm run lint` / `npm run typecheck` / `npm test` | the individual gates                                              |
| `npm run e2e`                                     | Playwright smoke tests (starts the servers itself)                |
| `npm run build`                                   | production builds of both apps                                    |
| `npm run generate:domain -- product`              | scaffold a domain across every layer                              |
| `npm run example:remove`                          | delete the reference domain                                       |
| `npm run mock-api:smoke`                          | walk the mock API's page and media routes on an isolated instance |

## The two editors

**Core (default).** `grapesjs` with the template's own shell: panels, keymaps, style sectors and a canvas renderer that draws every block with its React component. It is open source and needs no key. Nothing to configure.

**Studio SDK (optional).** The [GrapesJS Studio SDK](https://github.com/GrapesJS/studio) host, with the same builder plugin, canvas renderer, block library and save format, so a page is editable in either editor. To enable it, set two variables of the admin app:

```bash
NEXT_PUBLIC_BUILDER_EDITOR=studio
NEXT_PUBLIC_GRAPESJS_LICENSE_KEY=<your key>
```

- **Getting a key**: create a GrapesJS Studio account at https://app.grapesjs.com and take the licence key from there. The SDK skips the licence check on `localhost` and `127.0.0.1`, so local development works with an empty key; every deployed host needs the key.
- **Locally**: put both lines in `.env` at the workspace root and restart `npm run dev`.
- **In production**: set them in the hosting platform's environment (or pass them as `--build-arg` to the `Dockerfile`). `NEXT_PUBLIC_*` values are inlined at build time, so they must be set before `next build` runs; changing them needs a rebuild.
- **Without a key**: Core runs. With `studio` selected on a host other than localhost and an empty key, the admin shows a notice under the builder toolbar and falls back to Core.
- **Licences**: GrapesJS core is BSD-3-Clause (open source). The Studio SDK has its own commercial licence (`node_modules/@grapesjs/studio-sdk/LICENSE.md`, published at https://github.com/GrapesJS/studio/blob/main/LICENSE.md); read it before deploying Studio. The template ships no key and never will.

Details: [docs/builder.md](docs/builder.md) and [docs/studio-sdk.md](docs/studio-sdk.md).

## Starting a project from this repository

1. Create the repository from this template and clone it.
2. Replace the placeholder logo in `libs/assets` and both `public/favicon.svg` files.
3. Set the backend URLs in `.env` and, if the backend's paths differ, the auth paths in each app's `src/lib/auth/config.ts`.
4. If the backend's response shapes differ from the defaults, override the adapter once: see [docs/backend-adapter.md](docs/backend-adapter.md).
5. Implement the pages and media contract on the backend: [docs/pages-api.md](docs/pages-api.md) and [docs/openapi.yaml](docs/openapi.yaml).
6. Add the project's own blocks: [libs/components/src/lib/builder/README.md](libs/components/src/lib/builder/README.md) and [docs/builder.md](docs/builder.md).
7. Run `npm run generate:domain -- <name>` for the first real domain, then `npm run example:remove`.
8. Fill `ROUTE_PERMISSIONS` in `apps/admin/src/lib/permissions.ts` when the backend's permission names are known. Until then every signed-in operator sees everything.
9. Optionally plug an error-tracking vendor into `apps/*/src/lib/observability.ts`.
10. Optionally enable the Studio SDK (see above), or remove it entirely ([docs/studio-sdk.md](docs/studio-sdk.md)).

## Conventions

The rules agents and people follow in this repository are in [AGENTS.md](AGENTS.md). The short version: HTTP only in `libs/services/*.api.ts`, data only through hooks, UI from `@components`, blocks only in `libs/components/src/lib/builder`, strings through `t()` in the web app and `texts.ts` in the admin app, logical CSS properties everywhere, Zod at every boundary.

## Licence

MIT. See [LICENSE](LICENSE). Dependencies keep their own licences; see the Studio SDK note above.
