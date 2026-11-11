# Architecture

## Layers

```
backend API
   │  HTTP (fetch)
libs/services/shared/api-client.ts         transport + deadlines + error normalisation
libs/services/shared/backend-adapter.ts    the ONLY place that knows the backend's response shapes
libs/services/<domain>/<domain>.api.ts     typed calls, one per endpoint
libs/services/<domain>/<domain>.hooks.ts   TanStack Query hooks, models as `select`
apps/*/src/features/<feature>/*.hook.ts    URL state, composition, side effects
apps/*/src/features/<feature>/*.tsx        rendering only
```

`libs/dtos` holds the request and response contracts as Zod schemas. `libs/models` wraps response records in small classes with getters, so UI code reads `item.getTitle()` and never a raw field name. When the backend renames a field, the DTO and the model change; pages do not.

## The two apps

- **web** is the public, localised app. Routes live under `app/[locale]/`; `proxy.ts` (Next.js middleware) handles locale negotiation and the auth guard for `PROTECTED_PATHS`.
- **admin** is the operator app: single language, every route behind the auth guard except the auth pages, a sidebar shell, and permission-aware navigation (`lib/permissions.ts`).

Both apps have the same server-side auth plumbing through `createAuthServer` and the same client-side session query through `useCurrentUser`.

## Where state lives

- Server data: TanStack Query, through `@services` hooks only.
- Session: the `auth.me` query. Sign-in and sign-out mutations write into it. A 401 from any call dispatches `api:unauthorized`, which each app's `AuthEventHandler` turns into a signed-out state.
- UI state that must survive navigation: URL search params (see the examples list hooks).
- Ephemeral client state: React state, or a Zustand store if it is shared by distant components (none ship by default; add under `src/stores/`).

## Caching

The browser never uses its HTTP cache for API calls (`cache: "no-store"`); TanStack Query owns client caching with a 5-minute `staleTime`. Server renders get `gcTime: Infinity` so no timers outlive a request. Every BFF answer carries `Cache-Control: no-store, private` and `Vary: Cookie`.

## Error policy

`ApiClientError` carries `statusCode`, field `errors`, the backend `code` and a 429's `retryAfter`. Queries retry only network failures and throw 5xx to the nearest error boundary; 4xx are handled where the data is used. Mutations never retry (a timed-out write may have been applied) and show one toast unless the caller suppresses it.
