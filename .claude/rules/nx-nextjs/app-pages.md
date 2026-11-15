---
paths:
  - "apps/**"
  - "src/app/**"
  - "src/features/**"
---

# App pages and features

How a route is built in a Next.js App Router app of this stack. The layer rules are in
`layered-architecture.md`; the data rules in `services-and-data.md`.

## Three files per feature

```
app/<route>/page.tsx          server component: metadata, server fetch, orchestration, renders the feature
features/<area>/<thing>.tsx   client component: presentational only
features/<area>/<thing>.hook.ts  client hook: all behaviour (queries, mutations, form, local state, handlers)
```

| File        | Allowed                                                                                                                                         | Forbidden                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `page.tsx`  | `metadata` or `generateMetadata`, `await params`, server fetch via an exported API function or a thin `lib/` helper, `notFound()`, `redirect()` | `"use client"`, hooks, browser APIs, raw HTTP, business logic                  |
| `*.tsx`     | JSX, one call to its hook, render helpers, strings from `t()` or the texts module                                                               | `useState` for business state, React Query, `@services` hooks, hard-coded copy |
| `*.hook.ts` | `@services` hooks, form state, local UI state, handlers, effects                                                                                | raw HTTP, the API client, JSX                                                  |

A repository may name the hook differently (`useData`, `useThingPage`); follow its `AGENTS.md`.
The split itself is not negotiable: components render, hooks decide.

## Hook layout

Group the body with block-comment dividers in this order, omitting empty groups:

```ts
/* --------------------------------- State --------------------------------- */
/* --------------------------------- APIs ---------------------------------- */
/* --------------------------------- Form ---------------------------------- */
/* --------------------------------- Handlers ------------------------------ */
/* --------------------------------- LifeCycles ---------------------------- */
/* --------------------------------- Return -------------------------------- */
```

## Every fetching route has three states

Loading, error and empty are rendered, not implied. Route-level `error.tsx` and `not-found.tsx`
exist at the app root; add a route-level boundary for any new fetching route that does not
inherit one.

## Next.js specifics that bite

- `params` and `searchParams` are Promises: `await` them in server components.
- A statically prerendered page whose client component reads `useSearchParams()` wraps that
  component in its own `<Suspense>`, or `next build` refuses to prerender it.
- Do not add a `loading.tsx` above a locale or catch-all segment that calls `notFound()`: the
  shared Suspense boundary flushes the shell before `notFound()` runs and every missing page
  becomes a 200. Put loading UI inside the route instead.
- Static routes win over a catch-all. Keep the repository's reserved paths (sign-in, account,
  preview and the like, as its `AGENTS.md` lists them) static so no content slug can shadow them.
- Protected paths are declared in one list that the proxy or middleware reads; a new protected
  route is added there, not guarded ad hoc in the page.
- Strings in a localized app go through `t()`; strings in an English-only admin go through its
  texts module. Never both in one app.
