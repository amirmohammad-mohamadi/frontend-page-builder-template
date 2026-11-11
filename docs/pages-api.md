# Pages and media API

What a backend must implement for the page builder, how the bundled mock behaves, and how to point the apps at a real backend. The request and response contracts are the Zod schemas in `libs/dtos/src/lib/page/page.dto.ts` and `libs/dtos/src/lib/media/media.dto.ts`; the machine-readable version is [`openapi.yaml`](openapi.yaml). Hooks (`usePages`, `usePageBySlug`, `useUploadMedia`, …) live in `libs/services/src/lib/page` and `libs/services/src/lib/media`; paths are in `libs/services/src/lib/shared/endpoints.ts` under `page` and `media`.

## Routes

| Method | Path                                 | Audience  | Purpose                                                               |
| ------ | ------------------------------------ | --------- | --------------------------------------------------------------------- |
| GET    | `/api/v1/admin/pages`                | admin     | paginated list; `page`, `per_page`, `search` (slug, titles), `status` |
| POST   | `/api/v1/admin/pages`                | admin     | create a draft from `{ slug, title }` → 201                           |
| GET    | `/api/v1/admin/pages/{id}`           | admin     | one page with its draft and published copy                            |
| PATCH  | `/api/v1/admin/pages/{id}`           | admin     | save `slug`, `title`, `seo` or `draft` (never `published`)            |
| DELETE | `/api/v1/admin/pages/{id}`           | admin     | remove → 204                                                          |
| POST   | `/api/v1/admin/pages/{id}/publish`   | admin     | copy `draft` → `published`, set `published_at`, status `published`    |
| POST   | `/api/v1/admin/pages/{id}/unpublish` | admin     | clear `published` and `published_at`, status `draft`                  |
| GET    | `/api/v1/pages/{slug}`               | public    | the published page; 404 while unpublished                             |
| GET    | `/api/v1/pages/{slug}/preview`       | signed in | the page with its draft, for the operator's preview                   |
| GET    | `/api/v1/admin/media`                | admin     | paginated list; `page`, `per_page`, `search` (name)                   |
| POST   | `/api/v1/admin/media`                | admin     | `multipart/form-data` upload → 201 media asset                        |
| GET    | `/api/v1/admin/media/{id}`           | admin     | one asset                                                             |
| PATCH  | `/api/v1/admin/media/{id}`           | admin     | save `alt` (per locale) or `name`                                     |
| DELETE | `/api/v1/admin/media/{id}`           | admin     | remove the record and the file → 204                                  |

"admin" means a Bearer token of an operator; the admin app sends it through its BFF proxy (`/api/backend/...`), so the browser never holds it. "signed in" means any valid Bearer token; the web app's proxy adds it for the preview route. The public route needs no token and is called straight from the server render.

Every answer may be wrapped in `{ "data": ... }` and lists in `{ "data": [...], "meta": { "current_page", "last_page", "per_page", "total" } }`; the backend adapter (`docs/backend-adapter.md`) normalises other shapes. Errors are `{ "message", "errors": { "field": ["..."] } }` with a 422 for validation, 401 without a token, 403 for a non-operator, 404 for an unknown id or slug.

## The page record

```jsonc
{
  "id": 1,
  "slug": "help/getting-started", // ^[a-z0-9]+(?:[-/][a-z0-9]+)*$ ; unique
  "status": "published", // "draft" | "published"
  "title": { "en": "Getting started", "fa": "شروع کار" }, // per locale
  "seo": { "description": { "en": "..." }, "image": null }, // optional
  "draft": { "components": [], "styles": [], "css": "" }, // what the editor edits
  "published": { "components": [], "styles": [], "css": "" }, // what the web app renders, or null
  "published_at": "2026-01-15T09:00:00.000Z", // null while unpublished
  "created_at": "...",
  "updated_at": "...",
}
```

`components` is the GrapesJS component JSON tree (the root's children) and `styles` the GrapesJS CssRule JSON; the backend stores both opaquely (`unknown[]`) and never interprets them. `css` is the CSS string the editor compiled from `styles`, kept so the public app can render without GrapesJS. Translatable texts live inside the tree as one value per locale (a JSON object keyed by locale), so a page is one tree for every language.

### Draft and published

- Creating a page makes a `draft` with an empty tree; `published` is `null`.
- Saving (`PATCH` with `draft`) changes only the draft. Visitors keep seeing the last published copy.
- `POST .../publish` copies the draft into `published` verbatim, stamps `published_at` and sets `status` to `published`. Publishing again overwrites the copy.
- `POST .../unpublish` clears `published` and `published_at` and sets `status` back to `draft`. The public route answers 404 from then on; the draft is kept.
- `GET /api/v1/pages/{slug}` must never expose unpublished work. The mock answers the record with `draft` replaced by the published content, so the same `pageSchema` parses both routes; a backend may do the same or omit `draft`, in which case the web app's DTO must mark it optional.
- `GET /api/v1/pages/{slug}/preview` answers the full record (draft included) for any signed-in user, whatever the status.

Slugs may contain `/` (`help/getting-started`), so the public routes take the rest of the path as the slug; the frontend encodes each segment separately (`endpoints.page.bySlug`). A trailing `/preview` segment always selects the preview route, so a slug cannot end in `preview`.

## The media record and the upload format

```jsonc
{
  "id": 7,
  "url": "http://localhost:4000/uploads/7-logo.png", // absolute, publicly reachable
  "name": "logo.png", // display name, editable
  "mime": "image/png",
  "size": 1234, // bytes
  "width": 64, // null when unknown or not an image
  "height": 32,
  "alt": { "en": "Company logo" }, // per locale, editable
  "created_at": "...",
  "updated_at": "...",
}
```

Upload: `POST /api/v1/admin/media` as `multipart/form-data` with the bytes under the field **`file`** (with a filename) and an optional text field **`name`** for the display name. The answer is the media record with a 201. `mediaApi.upload(file, name?)` builds exactly this; `apiClient.upload` leaves the `Content-Type` to the browser so the boundary is right. The admin app's BFF proxy forwards bodies up to 10 MiB by default; raise `maxProxyBodyBytes` in `apps/admin/src/lib/auth/server.ts` for larger files (the backend and any reverse proxy need matching limits).

## How the mock behaves

- Admin routes need the access token of `admin@example.com` (`/api/v1/admin/auth/login`); the web account gets a 403. The preview route accepts either account's token.
- Pages and media live in memory and are written to `tools/mock-api/data/pages.json` and `media.json` after every change (both gitignored). On start those files are loaded when present; otherwise `tools/mock-api/seed/pages.json` provides one published sample page, slug `about`, whose tree uses placeholder attribute names and only has to parse. Delete the `data/` folder to start again from the seed.
- Uploads are stored as `tools/mock-api/uploads/<id>-<safe-name>` (gitignored) and served at `GET /uploads/<file>` with the content type derived from the extension (png, jpg/jpeg, webp, gif, svg, mp4, pdf; anything else `application/octet-stream`). Width and height are read from the header bytes of PNG, GIF and JPEG files; other types get `null`. The limit is 25 MiB.
- `MOCK_API_STATE_DIR` moves `data/` and `uploads/` elsewhere, `MOCK_API_DELAY_MS` changes the artificial latency (default 120 ms), `MOCK_API_PORT=0` picks a free port, `MOCK_API_PUBLIC_URL` sets the origin used in upload URLs. `npm run mock-api:smoke` starts an isolated instance and walks sign-in → create → preview → publish → public read → unpublish → upload → list → delete.

## Pointing the apps at a real backend

1. Set `NEXT_PUBLIC_API_BASE_URL` (what the browser calls for public routes) and `INTERNAL_API_BASE_URL` (what the Next.js server calls) in `.env`.
2. Keep `/api/v1/pages` in `WEB_PROXY_PREFIXES` and `ADMIN_PROXY_PREFIXES` (the preview route needs the session) and `/api/v1/admin` in the admin list; if the backend uses other paths, change the `page` and `media` groups in `endpoints.ts` and the prefixes together.
3. If the backend wraps or paginates differently, override the adapter once (`docs/backend-adapter.md`); if it names fields differently, change the DTO and the model, not the pages.
4. Make sure `url` on media records is absolute and reachable from the visitor's browser, and that the backend's upload limit matches the proxy's `maxProxyBodyBytes`.
