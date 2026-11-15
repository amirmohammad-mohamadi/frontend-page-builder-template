# Layered architecture

Applies to Nx workspaces with Next.js apps and the shared libraries `services`, `components`,
`models`, `dtos`, `utils`, `enums`. Single-app projects keep the same layers as folders under
`src/shared/` with the same aliases.

## One direction, no skipped layers

```
backend → services (apiClient → <domain>.api.ts → <domain>.hooks.ts) → app feature hook → presentational component
```

| Layer        | Tag            | May import                       | Owns                               |
| ------------ | -------------- | -------------------------------- | ---------------------------------- |
| apps         | `type:app`     | every lib                        | routes, feature hooks, app glue    |
| `services`   | `type:service` | dtos, models, utils, enums       | HTTP, React Query, query keys      |
| `components` | `type:ui`      | utils, type-only dtos and models | data-agnostic UI, builder blocks   |
| `dtos`       | `type:dto`     | enums                            | Zod request and response contracts |
| `models`     | `type:model`   | enums                            | domain classes with getters        |
| `utils`      | leaf           | nothing                          | pure synchronous helpers           |
| `enums`      | leaf           | nothing                          | shared enums                       |

ESLint enforces these edges where the repository has wired it. Where it has not, the table is
still a hard rule: an illegal edge is never acceptable "because lint did not catch it".

## Where code lives

- HTTP lives only in `*.api.ts` inside `services`. Apps and components never call `fetch`,
  `axios` or the API client; they call hooks exported from `@services`.
- Endpoints are declared once, in the services' shared `endpoints.ts`, grouped by domain. No URL
  string anywhere else.
- Backend shapes stop at the adapter inside `services`. Everything above sees frontend shapes.
- Reusable UI goes to `components`; pure helpers to `utils`; contracts to `dtos`; domain shapes
  to `models`. App-only glue stays in the app. When unsure, it almost never belongs in an app.

## Import hygiene

- Import from a lib root alias (`@services`, `@components`, `@models`, `@dtos`, `@utils`,
  `@enums`) or an explicitly sanctioned subpath. Never a deep path such as `@services/lib/...`.
- Sanctioned deep imports are listed in the repository's `AGENTS.md` (for example a
  server-only auth entry point). Do not add one without adding it there.
- Path aliases over relative paths when crossing a lib boundary.
- No circular dependencies between libs or between an app and a lib.

## Creating a lib

- Generate it with the Nx generator the repository uses (`npx nx g @nx/js:lib <name>` or the
  workspace's own), then give it a `type:*` tag in `project.json`, a root alias in
  `tsconfig.base.json`, a row in the layer table of `AGENTS.md`, and the matching
  `no-restricted-imports` entries in the ESLint config.
- A lib without a tag has no boundary; do not merge one.

## After a new cross-lib import (Nx workspaces)

Run `npx nx sync` so the TypeScript project references follow. The production build refuses to
run while they are stale, and `npx nx sync:check` is part of the quality gates. A single-app
repository has no project references and skips this step.
