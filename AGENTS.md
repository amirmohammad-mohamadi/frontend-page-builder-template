# Working in this repository

This file is the canon for people and coding agents alike. `CLAUDE.md` includes it. Stack-wide
rules (layers, services and data, components, pages, forms, i18n and RTL, e2e, mock API, page
builder blocks and editors, git workflow, coding style, secrets, quality gates) live in
`.claude/rules/` and load automatically in Claude Code; any other tool can read them as plain
Markdown. This file holds only what is specific to this repository; `apps/admin/AGENTS.md` and
`apps/web/AGENTS.md` hold the builder's own details.

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

## Specific to this repository

- **Endpoints live in `libs/services/src/lib/shared/endpoints.ts`**, grouped by domain; backend shapes stop in `backend-adapter.ts`.
- **Errors go through `captureError` (`@utils`)** and reach the user through toasts or inline error states.
- **Route-level `error.tsx` boundaries exist in both apps; the web app has no `loading.tsx` above `[locale]` on purpose**, because a shared Suspense boundary flushes the shell before `notFound()` runs and turns every 404 into a 200.
- **Web app strings go through `t()`** (next-intl, `apps/web/messages/*.json`). **Admin strings live in `apps/admin/src/texts.ts`.**
- **Environment through `env.ts`** in each app (validated with `createEnv`).
- **No vendor lock-in in the base**: error tracking is an interface (`setErrorReporter`), analytics and maps are left to the project.
- **Sessions are httpOnly cookies managed by the BFF routes** (`createAuthServer`). Client code never sees a token.
- **Blocks live only in `libs/components/src/lib/builder/blocks`** as plain React components with field definitions (`defineFields`, `BuilderBlockDefinition`); the editor and the web app both derive everything from the definition. See `docs/builder.md`.
- **Only `apps/admin/src/grapesjs/editor/studio-options.ts` and `apps/admin/src/features/builder/studio-host.tsx` import `@grapesjs/studio-sdk`.** The host is loaded with `next/dynamic`, so Core-only builds never bundle the SDK. See `docs/studio-sdk.md`.

## Commands

```bash
npm run dev            # mock API + both apps
npm run check          # Claude config check + lint + tools lint + typecheck + unit tests + word gate + format check (run before committing)
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

- **A domain**: `npm run generate:domain -- <name>`, then fill the DTO fields, the model getters and the admin table columns. Read the `example` domain for the finished shape. `/add-domain` walks the same steps.
- **A locale**: add the code to `apps/web/src/i18n/locales.ts` and a `messages/<code>.json`. Direction is derived from the language.
- **A content locale** (builder pages): the web locale above, plus the same code in `CONTENT_LOCALES` and `CONTENT_LOCALE_LABELS` in `apps/admin/src/config/locale.ts`; the two lists must match. See `docs/builder.md`.
- **A block**: a folder `libs/components/src/lib/builder/blocks/<type>/` with the component, `defineFields([...])` and a `BuilderBlockDefinition`, registered in `BUILDER_BLOCK_LIST` (`blocks/index.ts`). Nothing in either app changes; optionally add its icon to `apps/admin/src/grapesjs/editor/palette-icons.ts`. See `libs/components/src/lib/builder/README.md`. `/add-builder-block` walks the same steps.
- **An auth strategy**: add a DTO schema, then a route under `app/api/auth/<strategy>/route.ts` that exports `authServer.credentialHandler({ schema, path })`. See `docs/auth.md`.
- **A UI primitive**: `npx shadcn@latest add <name>` with `components.json` in the app, then move the file into `libs/components/src/lib/ui` and export it from the index.

## Commits

`.claude/rules/general/git-workflow.md` is the rule; `/check`, `/checkpoint`, `/publish` and `/sync` apply it. The default branch is the working branch of this template; projects made from it decide their own branching.
