# Web app (`apps/web`)

The public Next.js app: localised (`en` default, `fa` right-to-left), themed, signed in through the
BFF routes under `app/api/auth`. The root `AGENTS.md` is the canon; this file adds what is specific
to this app.

## Builder pages

The admin app's GrapesJS editor saves pages through `libs/services` (`pageApi`); this app renders
them. Nothing here knows GrapesJS: a page is a component JSON tree plus CSS, and
`renderPageContent` from `@components/builder` turns it into React on the server.

### Routes

| Route                         | File                                      | What it does                                                                                                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/[locale]/[...slug]`         | `app/[locale]/[...slug]/page.tsx`         | Renders the **published** copy of the page whose slug is the rest of the path (`/en/about`, `/fa/help/getting-started`). `generateMetadata` reads title, description and social image from the page; `notFound()` when there is no published page.                          |
| `/[locale]/preview/[...slug]` | `app/[locale]/preview/[...slug]/page.tsx` | Renders the **draft** for a signed-in operator under a sticky "not public" banner with a link to the published URL and the locale switcher. Listed in `PROTECTED_PATHS` (`lib/auth/config.ts`), so `proxy.ts` sends a signed-out visitor to `/login?next=…`. Never indexed. |

Static routes win over the catch-all in Next.js, so `/examples`, `/account`, `/login` and
`/preview/...` are never shadowed by a page slug. Both routes inherit `app/[locale]/error.tsx` and `not-found.tsx`. There is deliberately no
`loading.tsx` above them: a shared Suspense boundary would flush the shell before `notFound()`
runs and turn every missing page into a 200.

### How rendering works

1. `lib/page-slug.ts` joins the `[...slug]` segments with `/` and validates them against the DTO's
   `PAGE_SLUG_PATTERN` (lowercase `a-z0-9`, `-`, `/`); a slug ending in the reserved `preview`
   segment is refused too. An invalid slug is "not found" without a request.
2. `lib/page-resolver.ts` (`resolvePublishedPage`) calls `pageApi.getBySlug` on the server. It is
   wrapped in React's `cache()`, so `generateMetadata` and the page body share one backend call per
   request. A 404/410 becomes `{ status: "not-found" }`; any other `ApiClientError` comes back as
   `{ status: "error", error }` and the page throws it into `error.tsx`. A record without a
   published copy is treated as not found, so a draft is never exposed.
3. The page renders `renderPageContent(page.getPublished(), { locale, defaultLocale })` inside an
   `<article>`; the locale layout provides the site shell. The renderer sanitises the tree and the
   CSS, then renders each block for the request's locale with a fallback to the default locale.
   A published page with no components shows `pages.empty`.
4. The catch-all is `dynamic = "force-dynamic"`: pages change when an operator publishes, and no
   list endpoint exists to pre-generate from. Switch to `revalidate = 60` to trade freshness for
   fewer backend reads.
5. The preview is a client feature (`features/pages/page-preview.tsx` + `.hook.ts`) on
   `usePagePreview(slug)` from `@services`; the call goes through `/api/backend` (the BFF proxy adds
   the session token because `/api/v1/pages` is in `WEB_PROXY_PREFIXES`). States: loading skeleton,
   401/403 → `pages.previewSignIn` with a sign-in link that comes back to the preview, 404 →
   `pages.notFound`, other errors → `pages.loadError` with retry, empty draft → `pages.empty`.

### Where blocks live

`libs/components/src/lib/builder/blocks/<type>/` holds one React component plus its field schema
per block (`section`, `heading`, `text`, `button`, `hero`, …); `BUILDER_BLOCKS` is the registry
both the editor and the renderer use. Blocks never fetch: they render the attributes the tree
holds. This app adds nothing to a block; a block that needs data from an API gets it resolved
here, in the page, and passed in through the tree. See `libs/components/src/lib/builder/README.md`.

### The sample page

The mock API seeds one published page, slug `about`; the header links to it between the
`sample-page:start` / `sample-page:end` comments in `components/site-header.tsx` (message
`nav.about`). Delete the link and the messages when the project has its own pages.

### When the backend differs

- Other paths: change `endpoints.page.bySlug` / `endpoints.page.preview` in
  `libs/services/src/lib/shared/endpoints.ts` and keep `/api/v1/pages` (or its replacement) in
  `WEB_PROXY_PREFIXES` so the preview still carries the session.
- Other field names or a different wrapper: change the DTO, the model (`PageModel`) or the backend
  adapter, never these routes; they only call `getTitle`, `getSeoDescription`, `getSeoImage`,
  `getPublished`, `getDraft`, `isPublished`.
- A public route that answers the record whatever its status: the resolver already treats a
  missing `published` as not found.
- A sitemap entry per page needs a public list endpoint; `app/sitemap.ts` explains where to add it.
- Another slug grammar: change `PAGE_SLUG_PATTERN` in `libs/dtos`; `lib/page-slug.ts` follows it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
