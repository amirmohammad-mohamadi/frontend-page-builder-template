---
paths:
  - "tools/mock-api/**"
  - "docs/openapi.yaml"
  - "docs/*-api.md"
  - "**/endpoints.ts"
---

# Mock API and the backend contract

The backend is external. The repository ships the contract (Zod DTOs, an OpenAPI file, a
contract document) and a mock that implements it, so development, e2e and demos need no
backend.

## The contract is single-sourced

- Request and response shapes live in `@dtos`; the OpenAPI file in `docs/` describes the same
  shapes for backend developers. A change to one is a change to both, in the same commit.
- Endpoint paths are declared once in the services' `endpoints.ts`. The mock routes mirror that
  file; a path that exists in one and not the other is a bug.
- Pagination, error envelopes and status codes follow the contract document. The mock returns
  the same envelopes the real backend will, including validation errors with field names.

## The mock

- Persists to JSON files in a state folder that is gitignored, with a committed seed so a fresh
  clone has data. Uploads go to a gitignored folder served as static files.
- Reads its port, state folder and public URL from environment variables so the e2e suite can
  run an isolated instance beside the developer's.
- Has a smoke script that walks its own routes on an isolated instance; run it when the mock or
  the contract changes.
- Implements the audience split the real backend has (public, authenticated user, admin) with
  the seeded test accounts, so authorization paths can be exercised.

## When the real backend differs

Differences are absorbed in the services adapter (`backend-adapter.ts`), never above it. Update
the contract document with the real shape, then the adapter, then the mock, so the three never
disagree for long.
