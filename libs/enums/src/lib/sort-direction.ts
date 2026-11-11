/**
 * Shared enumerations live here, one file per concept, as `const` objects
 * with a derived union type (no TypeScript `enum`). Add domain enums beside
 * this one; `nx g ./tools/generators:domain` creates an `<name>-status.ts`
 * placeholder for each new domain.
 */
export const SortDirection = {
  Asc: "asc",
  Desc: "desc",
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];
