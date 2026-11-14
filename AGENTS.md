# Working in this repository

This file is the canon for people and coding agents alike. `CLAUDE.md` includes it.

## Shape

Two Next.js apps and seven libraries in an Nx workspace. Data flows in one direction and never skips a layer:

```
backend → libs/services (apiClient → <domain>.api.ts → <domain>.hooks.ts) → app feature hook → presentational component
```

| Project                    | Tag            | May import                        |
| -------------------------- | -------------- | --------------------------------- |
| `apps/web`, `apps/admin`   | `type:app`     | every lib                         |
| `libs/services`            | `type:service` | dtos, models, utils, enums        |
| `libs/components`          | `type:ui`      | utils (and type-only dtos/models) |
| `libs/dtos`                | `type:dto`     | enums                             |
| `libs/models`              | `type:model`   | enums                             |
| `libs/utils`, `libs/enums` | leaf           | nothing                           |

ESLint enforces these edges (`no-restricted-imports` blocks in `eslint.config.mts`). Import from a lib root alias (`@services`, `@components`, …), never a deep path. The one sanctioned deep import is `@services/auth/server`, which holds server-only code and must stay out of the `@services` barrel. Builder blocks and the renderer are imported as `@components/builder`.

## Rules

- **HTTP only in `*.api.ts`.** Apps and components never call `fetch` or `apiClient`; they call hooks from `@services`.
- **Endpoints live in `libs/services/src/lib/shared/endpoints.ts`**, grouped by domain.
- **Backend shapes live in the adapter** (`backend-adapter.ts`). Everything above it sees frontend shapes only.
- **Zod at every boundary**: form submit and request bodies validate with a `@dtos` schema; types are inferred, never hand-written twice.
- **Named exports, `type` over `interface`, JSDoc on every exported function.**
- **No `console.*` in shipped code**; report through `captureError` (`@utils`) and show failures through toasts or inline error states.
- **Every page that fetches renders loading, error and empty states.** Route-level `error.tsx` boundaries exist in both apps; the web app has no `loading.tsx` above `[locale]` on purpose, because a shared Suspense boundary flushes the shell before `notFound()` runs and turns every 404 into a 200.
- **Web app strings go through `t()`** (next-intl, `apps/web/messages/*.json`). **Admin strings live in `apps/admin/src/texts.ts`.**
- **Logical CSS only** (`ms-*`, `pe-*`, `start-*`, `text-end`), so right-to-left works without overrides.
- **Environment through `env.ts`** in each app (validated with `createEnv`); never scattered `process.env` reads. `NEXT_PUBLIC_*` only for truly public values.
- **No vendor lock-in in the base**: error tracking is an interface (`setErrorReporter`), analytics and maps are left to the project.
- **Sessions are httpOnly cookies managed by the BFF routes** (`createAuthServer`). Client code never sees a token.
- **Blocks live only in `libs/components/src/lib/builder/blocks`** and are plain React components with field definitions (`defineFields`, `BuilderBlockDefinition`). They never fetch; the editor and the web app both derive everything from the definition. See `docs/builder.md`.
- **Only `apps/admin/src/grapesjs/editor/studio-options.ts` and `apps/admin/src/features/builder/studio-host.tsx` import `@grapesjs/studio-sdk`.** The host is loaded with `next/dynamic`, so Core-only builds never bundle the SDK. See `docs/studio-sdk.md`.

## Commands

```bash
npm run dev            # mock API + both apps
npm run check          # lint + tools lint + typecheck + unit tests + word gate + format check (run before committing)
npm run e2e            # Playwright smoke tests
npm run mock-api:smoke  # walk the mock API's page and media routes on an isolated instance
npm run generate:domain -- <name>   # scaffold a domain
npm run example:remove              # drop the reference domain
```

Typecheck is `tsc -b` per project (libs first, then each app); there is no Nx typecheck target for the apps.

After adding a new cross-lib import, run `npx nx sync` so the TypeScript project references follow; the production build refuses to run while they are stale.

## Shared between the apps

Both apps are thin: the transport comes from `installApiTransport` (`@services`), form errors from `describeApiError` (`@services`) rendered by `FormError` (`@components`), the theme switch from `ThemeToggle` (`@components`) with translated labels, and the development error reporter from `consoleErrorReporter` (`@utils`). A third app reuses them the same way; do not copy them into an app.

## Adding things

- **A domain**: `npm run generate:domain -- <name>`, then fill the DTO fields, the model getters and the admin table columns. Read the `example` domain for the finished shape.
- **A locale**: add the code to `apps/web/src/i18n/locales.ts` and a `messages/<code>.json`. Direction is derived from the language.
- **A content locale** (builder pages): the web locale above, plus the same code in `CONTENT_LOCALES` and `CONTENT_LOCALE_LABELS` in `apps/admin/src/config/locale.ts`; the two lists must match. See `docs/builder.md`.
- **A block**: a folder `libs/components/src/lib/builder/blocks/<type>/` with the component, `defineFields([...])` and a `BuilderBlockDefinition`, registered in `BUILDER_BLOCK_LIST` (`blocks/index.ts`). Nothing in either app changes; optionally add its icon to `apps/admin/src/grapesjs/editor/palette-icons.ts`. See `libs/components/src/lib/builder/README.md`.
- **An auth strategy**: add a DTO schema, then a route under `app/api/auth/<strategy>/route.ts` that exports `authServer.credentialHandler({ schema, path })`. See `docs/auth.md`.
- **A UI primitive**: `npx shadcn@latest add <name>` with `components.json` in the app, then move the file into `libs/components/src/lib/ui` and export it from the index.

## Commits

One-line imperative messages. No attribution trailers, no generated-with lines. Run `npm run check` first.
