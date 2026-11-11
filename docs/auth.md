# Authentication

## Model

Backend-for-frontend (BFF) with httpOnly cookies. The browser posts credentials to its own origin (`/api/auth/login`); the route exchanges them with the backend, stores the token pair in `<prefix>_access` and `<prefix>_refresh` cookies, and returns only the user. Authenticated backend calls go through `/api/backend/<path>`, which attaches the token server-side, refreshes it once on a 401 (single flight per refresh token), and rotates the cookies. Client JavaScript never holds a token.

`createAuthServer` in `libs/services/src/lib/auth/server` builds all of this for one app from a config object; each app's `src/lib/auth/server.ts` is that one call and the route files are one-line re-exports.

## What the backend must provide

| Operation                                 | Default path (web)                                   | Expected answer                                                                |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| login                                     | `POST /api/v1/auth/login`                            | `{ access_token, refresh_token, expires_in?, user }` (optionally under `data`) |
| refresh                                   | `POST /api/v1/auth/refresh` with `{ refresh_token }` | same as login                                                                  |
| me                                        | `GET /api/v1/me` with Bearer                         | the user (optionally under `data` or `user`)                                   |
| logout                                    | `POST /api/v1/auth/logout` with Bearer               | anything                                                                       |
| register, forgot-password, reset-password | optional                                             | as login / `{}`                                                                |

Change the paths in `apps/*/src/lib/auth/config.ts`. If the backend names the token fields differently, pass `readAuthPayload` (and `readUser`) in the `backend` config to map its body onto `AuthPayloadDto`. If its refresh body differs, pass `refreshBody`.

## The session route

`GET /api/auth/me` answers `200 { data: { user } }` when signed in and `200 { data: { user: null } }` when not. A signed-out visitor is a normal state, not an error, so the browser console stays clean and `useCurrentUser` treats both answers the same way. The backend's own 401 on an expired session still clears the cookies and answers `{ user: null }`.

## Adding a strategy

Every strategy is "validate a body, post it to the backend, open a session from the answer". That is `authServer.credentialHandler`:

```ts
// apps/web/src/app/api/auth/otp/verify/route.ts
import { z } from "zod";
import { authServer } from "@/lib/auth/server";

const schema = z.object({ phone: z.string(), code: z.string().length(6) });
export const POST = authServer.credentialHandler({ schema, path: "/api/v1/auth/otp/verify" });
```

A step that does not open a session (sending the code) is `authServer.passthroughHandler`. Social sign-in works the same way: the callback route receives the provider code and exchanges it through `credentialHandler` with the backend's callback path. Nothing in the library changes.

## Cookies, "remember me" and limits

- Production builds write `Secure` cookies. Set `AUTH_COOKIE_SECURE=false` only for a staging host served over plain http.
- A sign-in body with `remember: false` opens a browser-session cookie pair (no `Max-Age`); `true` or absent keeps the cookies for the tokens' lifetimes. A strategy can decide this itself with its `persistent` option.
- Auth routes read at most 64 KiB of body and the proxy forwards at most 10 MiB (`maxAuthBodyBytes`, `maxProxyBodyBytes` in the config); larger bodies answer 413 before anything is parsed.
- A backend 401 ends the session only when the refresh token is missing or rejected. A 401 the backend returns after a successful refresh is passed through as the endpoint's own answer, and the session stays.
- The proxy forwards `content-type`, `accept` and `accept-language` by default; list more in `forwardHeaders`.

## The edge guard

`createAuthGuard` runs in `proxy.ts` and decides from the cookies alone (no network): a refresh cookie or an unexpired access cookie counts as signed in. It is a convenience, not the security boundary; the backend still rejects bad tokens, and the BFF clears the cookies when it does.

## Two apps on one host

Cookies ignore the port, so the web and admin apps use different cookie prefixes (`web`, `admin`). Keep that when adding a third app.
