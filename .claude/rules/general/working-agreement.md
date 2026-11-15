# Working agreement

How an agent works in a repository that ships this configuration. Technology-specific rules live
in the other rule folders; this file is about conduct.

## Read before you write

- Read the nearest `AGENTS.md` first (root, then the app or lib you are in). The nested file wins
  on conflicts inside its folder. `CLAUDE.md` only imports `AGENTS.md`, so every tool reads one
  source.
- When a rule here and the repository's `AGENTS.md` disagree, the repository wins. Report the
  disagreement so the two can be reconciled (see `skills/write-conventions`).
- Find the finished example before adding a feature (a reference domain, an existing page, an
  existing block) and follow its shape. Do not invent a second pattern for the same job.

## Scope

- Deliver the request as asked. Do not narrow, widen or transform it without saying so.
- Unrelated problems you notice are reported, not fixed in the same change.
- Routine judgment calls are yours. Ask only when the readings would lead to materially
  different work, and ask once, with your recommendation first.

## Honesty of reporting

- Say what you verified and how. "Tests pass" means you ran them in this change and saw the
  result.
- If a step was skipped, blocked or could not be verified, say so first, before the summary.
- Never describe a plan as done.

## Code and documentation move together

- A change that alters a convention, a command, an environment variable or a route updates the
  document that describes it in the same commit (`AGENTS.md`, `docs/`, `.env.example`,
  `README.md`).
- Comments explain why, not what. Delete comments that restate the code.

## Deterministic output

- Identical inputs produce identical files: same naming, same file layout, same section order
  as the existing examples. Do not introduce stylistic drift between domains or pages.
