# Add-domain checklist

Tick every line before the domain is called done.

## Layers

- [ ] DTO schemas exist for every request body and query; types are `z.infer`, never hand-written.
- [ ] The model exposes getters only; no HTTP, no React, no formatting that depends on locale.
- [ ] Every endpoint is in the shared `endpoints.ts`; no URL literal in api, hooks or apps.
- [ ] `*.api.ts` uses only the shared API client and returns models.
- [ ] `*.hooks.ts` is the only place with React Query; keys come from `*.query-keys.ts`.
- [ ] Mutations invalidate in the hook and chain the caller's `onSuccess`.
- [ ] Lib roots export the new surface; no consumer uses a deep import.
- [ ] In an Nx workspace: `npx nx sync` ran and `npx nx sync:check` passes.

## Apps

- [ ] Admin route: server `page.tsx`, presentational component, feature hook, texts module.
- [ ] Table has loading, error and empty states; create and edit forms use the DTO schema with
      the resolver; delete asks for confirmation.
- [ ] Public consumer (if any) fetches on the server for metadata and first paint.
- [ ] Strings: `t()` in the localized app, texts module in the admin; every locale file has the
      new keys.
- [ ] Logical CSS; the page was opened in a right-to-left locale.

## Supporting pieces

- [ ] Mock API routes and seed data (when the repository has a mock).
- [ ] Unit tests for model and adapter; e2e for the admin list when a suite exists.
- [ ] `AGENTS.md`, `docs/` and the OpenAPI file updated when they describe domains.
- [ ] Quality gates green; production build green when routing changed.
