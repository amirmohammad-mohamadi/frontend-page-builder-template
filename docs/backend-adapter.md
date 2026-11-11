# Backend adapter

`libs/services/src/lib/shared/backend-adapter.ts` is the one file that knows how a backend shapes its JSON. It has three jobs:

| Method                                | Default behaviour                                                                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unwrap(body)`                        | returns `body.data` when the body is a small wrapper with a `data` member, else the body                                                                                                                                                         |
| `readList(body)`                      | items from `data`, `items` or `results` (or a bare array); pagination from `meta`, `pagination`, `_paginate` or the root, in `snake_case` or `camelCase` (`current_page`, `page`, `per_page`, `pageSize`, `total`, `last_page`, `totalPages`, …) |
| `readError(body, status, statusText)` | message from `message`, `error.message`, `detail` or `title`; code from `code`; field errors from a `{ field: string[] }` map, a `{ field: string }` map, or a list of `{ field \| field_name \| path, message \| errors }`                      |

If a backend fits these conventions, nothing needs configuring. If it does not, override once at app start (the apps' `lib/api-client-setup.ts` is imported by the root providers and is the right place):

```ts
import { configureBackendAdapter, defaultBackendAdapter } from "@services";

configureBackendAdapter({
  readList: (body) => ({
    items: body.results,
    paginate: { currentPage: body.pageNumber, perPage: body.pageSize, total: body.totalCount },
  }),
  // unwrap and readError keep their defaults
});
```

Requests are shaped by the transport (`installApiTransport` in each app's `lib/api-client-setup.ts`: base URLs, proxied prefixes, extra headers) and, for the BFF, by `createAuthServer`'s `backend` config (`readAuthPayload`, `readUser`, `refreshBody`, `headers`) and `forwardHeaders` (which request headers the proxy passes on).

Hooks, pages and the generator never change: they consume `NormalizedList<T>`, `ApiErrorDto` and the unwrapped payload.

Unit tests for the default adapter are next to it (`backend-adapter.spec.ts`); add a case there when a new backend shape is supported.
