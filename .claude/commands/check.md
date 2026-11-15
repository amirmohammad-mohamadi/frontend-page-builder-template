---
description: Run every quality gate the repository defines and report each result honestly
argument-hint: [fast | full]
allowed-tools: Bash(npm run *), Bash(npm test *), Bash(npx nx *), Bash(npx tsc *), Bash(npx prettier *), Bash(npx eslint *), Bash(npx playwright *), Read, Grep, Glob
---

Run the quality gates defined in `rules/general/quality-gates.md` for this repository.

1. Find the gate commands in `AGENTS.md` and `package.json` (an aggregate script such as
   `npm run check` when it exists; otherwise lint, typecheck, unit tests, format check, word
   gate, and `npx nx sync:check` in an Nx workspace).
2. Mode `$ARGUMENTS`:
   - `fast` or empty: the aggregate script only.
   - `full`: the aggregate script, then the production build, then the end-to-end suite when the
     repository has one (stop any dev server that holds its ports first).
3. Run the gates one after another. Do not stop at the first failure; collect all results.
4. Report a table of gate, result and the first relevant error line for each failure. If a gate
   could not run, say so and name it; never report it as passed.
5. Do not fix anything in this command. Fixing is the caller's decision.
