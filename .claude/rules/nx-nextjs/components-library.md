---
paths:
  - "libs/components/**"
  - "src/shared/components/**"
---

# Shared components library

Everything under the components lib is presentational and data-agnostic. It is consumed by
every app, so it must not know where data comes from.

## Forbidden everywhere in the lib

| Forbidden                                | Why                                              |
| ---------------------------------------- | ------------------------------------------------ |
| `fetch`, `axios`, the API client         | HTTP exists only in services                     |
| `@services` imports                      | data fetching belongs to the app layer           |
| React Query                              | lives only in services hooks                     |
| business workflows, permissions, routing | components render; the app decides               |
| user-facing strings baked in             | strings come from the app through props or `t()` |

## Allowed

- Pure UI state (`useState` for open, hover, selection) and visual interaction logic (drag,
  keyboard navigation, animation).
- `@utils` helpers; `@models` and `@dtos` as `import type` for prop typing only.
- Translated labels passed in as props, so the same component serves every locale and every app.

## The `ui/` folder (shadcn primitives)

Files under `lib/ui/` follow shadcn's own patterns: single-file, generated with
`npx shadcn@latest add <name>` and then moved into the lib and exported from the index. They are
exempt from any hook-separation rule but still purely presentational.

## Builder blocks

A repository that ships a page builder keeps its blocks under `lib/builder/blocks/` as plain
React components with a field definition. They follow this file plus that repository's
page-builder rule; a block never fetches.

## Structure of a non-trivial component

Keep rendering and behaviour apart: `thing.tsx` renders, `thing.hook.ts` (or `use-thing.ts`)
holds the behaviour, both exported from the lib index. Do not force this split on a primitive.

## Validation before finishing

- No import of `@services`, `@tanstack/react-query`, `fetch` or `axios` in the lib.
- Every component works with props alone in a story, a test or the builder canvas.
- Logical CSS only (`rules/nx-nextjs/i18n-and-rtl.md`).
