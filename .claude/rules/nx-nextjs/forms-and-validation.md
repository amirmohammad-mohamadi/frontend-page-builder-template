---
paths:
  - "libs/dtos/**"
  - "src/shared/dtos/**"
  - "**/*-form.tsx"
  - "**/*-form.hook.ts"
  - "**/forms/**"
  - "**/*.dto.ts"
---

# Forms and validation

Zod at every trust boundary, one schema per contract, types inferred.

## Schemas

- Request bodies, query parameters and form values each have a Zod schema in the dtos lib,
  grouped by domain (`libs/dtos/src/lib/<domain>/<thing>.dto.ts`).
- The TypeScript type is `z.infer<typeof schema>`. Never a hand-written twin.
- Response shapes are validated in the services adapter when the backend is not trusted to be
  stable; the result is mapped to a model before it leaves the services lib.

## Forms

- `react-hook-form` with `zodResolver(schema)`; the schema comes from `@dtos`, never declared in
  the component.
- The form instance lives in the feature hook and is passed down to the presentational
  component and its children through props.
- Submit handlers call a `@services` mutation hook. Success side effects (toast, close drawer,
  navigate) are passed as `options.onSuccess`; cache invalidation is the hook's job.
- Server-side validation errors are translated into field errors through the project's shared
  API-error helper and rendered by its shared form-error component (the `AGENTS.md` names them).
  Do not parse raw error bodies in a form.

## Messages

- Validation messages are keys, resolved through `t()` or the texts module at render time, so
  one schema serves every locale.
- Numbers and dates in messages go through the project's formatters, never string
  concatenation.
