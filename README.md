# Frontend Page Builder Template

A production-ready foundation for Next.js projects: a public web app and an admin app in one Nx workspace, sharing typed libraries, with authentication, localisation (including right-to-left), theming, a backend-agnostic services layer and a domain generator. No business domain is included; the `example` domain exists only to prove every layer and is removed with one command.

## Quick start

```bash
npm install
cp .env.example .env        # defaults already point at the mock API
npm run dev                 # mock API :4000, web :3000, admin :3001
```

Sign in with `user@example.com` / `password` on the web app and `admin@example.com` / `password` on the admin app.

Individual servers: `npm run mock-api`, `npm run web`, `npm run admin`.

## What is inside

```
apps/
  web/        public app: next-intl (en + fa), RTL, theme, auth pages, account, example pages
  admin/      operator app: shadcn sidebar shell, sign-in, permission-aware navigation, example CRUD
libs/
  components/ shadcn/ui primitives only (38) + the shared Tailwind theme
  services/   apiClient, backend adapter, query hooks, BFF auth server factory, domain api/hooks
  dtos/       Zod schemas and inferred types (request/response contracts)
  models/     thin domain classes over API records
  enums/      shared const enums
  utils/      pure helpers: cn, formatting, URL, text direction, env validation, error reporting
  assets/     placeholder logo
tools/
  mock-api/   dependency-free mock backend
  generators/ `nx g ./tools/generators:domain <name>`
  scripts/    check-words gate, example removal
e2e/          Playwright smoke tests over both apps
docs/         architecture, auth, backend adapter, environment, generator
```

## Daily commands

| Command                                           | What it does                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                                     | all three dev servers                                            |
| `npm run check`                                   | lint, tools lint, typecheck, unit tests, word gate, format check |
| `npm run lint` / `npm run typecheck` / `npm test` | the individual gates                                             |
| `npm run e2e`                                     | Playwright smoke tests (starts the servers itself)               |
| `npm run build`                                   | production builds of both apps                                   |
| `npm run generate:domain -- product`              | scaffold a domain across every layer                             |
| `npm run example:remove`                          | delete the reference domain                                      |

## Starting a project from this repository

1. Create the repository from this template and clone it.
2. Replace the placeholder logo in `libs/assets` and both `public/favicon.svg` files.
3. Set the backend URLs in `.env` and, if the backend's paths differ, the auth paths in each app's `src/lib/auth/config.ts`.
4. If the backend's response shapes differ from the defaults, override the adapter once: see `docs/backend-adapter.md`.
5. Run `npm run generate:domain -- <name>` for the first real domain, then `npm run example:remove`.
6. Fill `ROUTE_PERMISSIONS` in `apps/admin/src/lib/permissions.ts` when the backend's permission names are known. Until then every signed-in operator sees everything.
7. Optionally plug an error-tracking vendor into `apps/*/src/lib/observability.ts`.

Everything else works out of the box.

## Conventions

The rules agents and people follow in this repository are in [AGENTS.md](AGENTS.md). The short version: HTTP only in `libs/services/*.api.ts`, data only through hooks, UI from `@components`, strings through `t()` in the web app and `texts.ts` in the admin app, logical CSS properties everywhere, Zod at every boundary.

## Licence

MIT. See [LICENSE](LICENSE).
