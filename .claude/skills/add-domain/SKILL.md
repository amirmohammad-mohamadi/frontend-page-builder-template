---
name: add-domain
description: Add a new backend-facing domain (model, DTO schemas, endpoints, API functions, React Query hooks, query keys, admin list page, public consumer) to an Nx + Next.js repository of this stack, in the fixed layer order and with the fixed naming. Use when asked to "add a domain", "wire a new entity", "add CRUD for <thing>" or when a feature needs data the services lib does not expose yet.
argument-hint: <domain-name> [fields...]
---

# Add a domain

Work outward from the backend contract and never skip a layer
(`rules/nx-nextjs/layered-architecture.md`, `services-and-data.md`). Repositories that ship a
generator (`npm run generate:domain -- <name>`) run it first and then fill the blanks; the steps
below are what the generator produces, so follow them by hand where no generator exists.

## Before starting

1. Read the reference domain the repository names in `AGENTS.md` (often `example`). Your domain
   mirrors its files one for one.
2. Confirm the backend contract: endpoint paths, request and response shapes, pagination
   envelope. Write them down in the task notes; do not guess them midway.
3. Pick the kebab-case domain name and the PascalCase model name once; use them consistently.

## Steps, in this order

| Step | Where                                                   | What                                                                                                                                                                                              |
| ---- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `dtos/<domain>/<domain>.dto.ts`                         | Zod schemas for list query, create body, update body, and the response item. Types via `z.infer`.                                                                                                 |
| 2    | `models/<domain>/<domain>.model.ts`                     | A class with getters over the response shape (`getId()`, `getName()`, derived values). No I/O.                                                                                                    |
| 3    | `services/shared/endpoints.ts`                          | One grouped entry per endpoint. No URL anywhere else.                                                                                                                                             |
| 4    | `services/<domain>/backend-adapter.ts` (if present)     | Map backend shape to frontend shape. Everything above sees frontend shapes only.                                                                                                                  |
| 5    | `services/<domain>/<domain>.api.ts`                     | Pure functions over the API client: list, get, create, update, remove. Validate bodies with step 1.                                                                                               |
| 6    | `services/<domain>/<domain>.query-keys.ts`              | `THING_QUERY_KEY` and parameterised builders.                                                                                                                                                     |
| 7    | `services/<domain>/<domain>.hooks.ts`                   | `useThings`, `useThing`, `useCreateThing`, `useUpdateThing`, `useDeleteThing`. Invalidate in `onSuccess`, chain `options?.onSuccess`.                                                             |
| 8    | `services/index.ts`, `dtos/index.ts`, `models/index.ts` | Export the new public surface from each lib root.                                                                                                                                                 |
| 9    | admin app: route + feature                              | `page.tsx` (server) + `<thing>-list.tsx` + `<thing>-list.hook.ts` + strings in the texts module. Table columns, create/edit form with the DTO schema, delete confirm, loading/error/empty states. |
| 10   | public app (when the domain is public)                  | Server fetch in `page.tsx` through the exported API function or a thin `lib/` helper; client feature hook for interaction only.                                                                   |
| 11   | mock API (when the repository ships one)                | Routes and seed data for the new endpoints, so `npm run dev` and e2e work without a backend.                                                                                                      |
| 12   | docs                                                    | `AGENTS.md` adding-things section if a new pattern appeared; `docs/` API contract and OpenAPI file when the repository keeps them.                                                                |

## Finish

- In an Nx workspace, `npx nx sync` after the new cross-lib imports; then the quality gates
  (`/check`).
- A unit test for the model getters and the adapter mapping; an e2e test for the admin list
  when the repository has a suite.
- Run [reference.md](reference.md) as the final checklist.
