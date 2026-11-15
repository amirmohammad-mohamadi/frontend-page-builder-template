# Quality gates

The definition of done for any change. `/check` runs the mechanical part; `skills/verify-change`
describes the manual part in detail.

## Before a commit

1. Lint, typecheck, unit tests, formatting check and the word gate all pass. Use the project's
   aggregate script (`npm run check` or whatever `AGENTS.md` names) rather than guessing at the
   individual commands.
2. Generated files and project references are in sync when the toolchain tracks them; the
   stack rules name the command.
3. The production build passes when the change touches routing, rendering, environment handling
   or dependencies. Prerender failures only show up there.
4. A gate is never made to pass by weakening it: no loosened lint rule, no `skip` on a test, no
   relaxed compiler option, no formatter ignore. Fix the code, or say the gate is red and why.

## Before calling UI work done

- Every page that fetches renders its loading, error and empty states, and each was seen at
  least once.
- The change was exercised in a running app, not only in tests: the route opened, the action
  performed, the result observed. Share the evidence (a screenshot, a network log, a server log).
- Right-to-left locales were checked when the project has them; the stack's i18n rule says how.
- End-to-end tests run when they exist for the area; add one for a new user-visible flow.

## Tests

- Keep tests next to the code they cover and run them through the project's runner.
- A fix for a bug comes with the test that would have caught it.
- Never mark a test as expected to fail to get a green run; fix the code or delete the test and
  say so.

## Never skip

If a gate cannot run (a tool is missing, a service is down), report that first and name the gate.
A green report with a silent gap is worse than a red one.
