# Environment

Every variable is read in one place per app, `apps/<app>/src/env.ts`, through `createEnv` from `@utils`, which validates with Zod at module load and throws a readable list of problems if something is wrong. Every variable has a development default, so a fresh clone runs without a `.env`.

| Variable                     | Used by | Purpose                                                                             |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`   | both    | backend origin the browser calls for public endpoints (inlined at build)            |
| `INTERNAL_API_BASE_URL`      | both    | backend origin the server calls (BFF routes, SSR)                                   |
| `WEB_PROXY_PREFIXES`         | web     | comma-separated backend path prefixes the BFF proxy forwards with the session token |
| `ADMIN_PROXY_PREFIXES`       | admin   | same for the admin app                                                              |
| `AUTH_COOKIE_SECURE`         | both    | force the `Secure` cookie flag; default: production + https backend                 |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | web     | must be one of the locales in `src/i18n/locales.ts`                                 |
| `NEXT_PUBLIC_SITE_URL`       | web     | public origin for canonical links and the sitemap                                   |

Rules:

- `NEXT_PUBLIC_*` ships to the browser and is inlined at build time. Never a secret, and changing it needs a rebuild.
- Server-only values never get the `NEXT_PUBLIC_` prefix.
- Reference `process.env.NAME` literally in `env.ts` so Next.js can inline the public ones; never build the name dynamically.
- The proxy prefix lists are the allow-list of the BFF proxy. A path outside them answers 404 before reaching the backend, so the proxy can never be turned into an open relay.
