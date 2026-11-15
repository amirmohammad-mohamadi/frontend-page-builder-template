# Coding style

Language-level rules that hold in every TypeScript project shipping this configuration.
Formatting itself is Prettier's job; do not argue with it.

## Declarations

- Named exports by default. `export default` only where a framework requires it (framework
  route files, configuration factories).
- `type` over `interface` for new declarations. Leave existing interfaces alone; do not churn.
- `import type` for type-only imports, so runtime edges stay visible and boundaries stay clean.
- Infer types from schemas and constants (`z.infer`, `as const`) instead of maintaining a
  parallel hand-written type.

## Functions

- Every exported function, hook and component has a one-line JSDoc summary. Document a
  parameter only when its meaning is not obvious from its name and type.
- Small, single-purpose functions. A function that needs section dividers is two functions.

## Hygiene

- No `console.*` in shipped code. Report through the project's error reporter and show failures
  to the user through its toast or inline error component.
- No dead code: no unused exports, props or files, no commented-out blocks. Delete, do not
  disable.
- No `any` without a comment explaining why the boundary cannot be typed.
- No `// eslint-disable` without the rule name and a reason on the same line.

## Naming

- Files: kebab-case. Components: PascalCase. Hooks: `useThing`. Constants: `UPPER_SNAKE` only
  for true constants.
- File suffixes carry the layer (`*.spec.ts` for tests, and whatever the stack rules define for
  its layers); a file whose suffix lies about its contents is a bug.
