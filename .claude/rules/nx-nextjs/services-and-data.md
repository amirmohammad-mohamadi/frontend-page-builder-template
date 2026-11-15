---
paths:
  - "libs/services/**"
  - "src/shared/services/**"
  - "**/*.api.ts"
  - "**/*.hooks.ts"
  - "**/*.query-keys.ts"
---

# Services and data layer

The contract for `*.api.ts`, `*.hooks.ts` and `*.query-keys.ts`. The layer table is in
`layered-architecture.md`; this file is about what each file kind may contain.

## `<domain>.api.ts`: pure HTTP

- Every call goes through the shared API client. No other HTTP mechanism exists in the lib.
- Pure functions: inputs, one client call, a frontend-shaped return value (a model or a
  paginated model). No React, no React Query, no DOM, no toast, no navigation.
- Request bodies are validated with the domain's Zod schema from `@dtos` before they leave.
- Errors are not caught and reshaped. The client normalises them into the project's API error
  type; callers branch on that type.
- Uploads use the client's multipart helper, never a hand-built `fetch`.

## `<domain>.hooks.ts`: React Query lives here and only here

- `useQuery` and `useMutation` appear in hooks files inside the services lib and nowhere else:
  not in `*.api.ts`, not in apps, not in components.
- `queryFn` and `mutationFn` call the domain's API functions. Never raw HTTP.
- Naming follows the existing domains: `useThings`, `useThing`, `useCreateThing`,
  `useUpdateThing`, `useDeleteThing`.
- Cache invalidation is the hook's job: `onSuccess` invalidates the domain's keys, then chains
  the caller's `options?.onSuccess`.

## `<domain>.query-keys.ts`: one source of keys

- `export const THING_QUERY_KEY = ["thing"] as const;` plus any parameterised builders.
- No ad-hoc key arrays in hooks or apps. A key that is not in this file does not exist.

## Who owns a mutation's side effects

| Layer | Owns                                               | Must not own                             |
| ----- | -------------------------------------------------- | ---------------------------------------- |
| API   | the request, normalised errors                     | cache, toast, modal, navigation          |
| Hook  | cache invalidation, passing app callbacks through  | defining toasts, modals or navigation    |
| App   | toast, modal, drawer state, navigation, form reset | query keys, raw HTTP, invalidation logic |

## Public surface

The lib exports through its root `index.ts`: hooks, the API error helpers, the transport
installer, and types. API functions and the client itself are exported only when a server
component in an app must call them directly, and that case is named in the app's `AGENTS.md`.
