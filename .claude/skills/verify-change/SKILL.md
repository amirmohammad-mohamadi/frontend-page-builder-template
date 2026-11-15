---
name: verify-change
description: The verification procedure for a code change in this stack: which gates to run for which kind of change, how to exercise the change in the running app, what evidence to capture, and how to report it without overstating. Use before a checkpoint, before a pull request, when asked "does it work", or when a task says "test it".
---

# Verify a change

Verification produces evidence, not reassurance. `rules/general/quality-gates.md` says what
must be true; this skill says how to establish it.

## 1. Classify the change

| Change touches                                 | Required                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| anything                                       | aggregate gate script (lint, typecheck, unit tests, format, word gate) |
| cross-lib imports, project files               | `npx nx sync:check` (Nx workspaces only)                               |
| routing, rendering, env handling, dependencies | production build of each affected app                                  |
| user-visible behaviour                         | the flow exercised in a running app, in a browser, with proof          |
| a multi-locale app's UI                        | the same flow in one right-to-left locale                              |
| an area with end-to-end tests                  | that suite; a new test for a new flow                                  |
| a mock API or contract file                    | the mock's own smoke script, when one exists                           |

## 2. Run the gates

- Use the repository's scripts (`AGENTS.md` and `package.json`); do not reconstruct them.
- Run gates sequentially and collect every result; do not stop at the first failure.
- Builds and end-to-end suites compete with running dev servers for ports and CPU: stop the dev
  servers first, or run the suite against its own isolated instance when the configuration
  supports it.
- Long commands run in the background with a generous timeout; read the log afterwards.

## 3. Exercise the change

1. Start the servers the way the repository documents (`npm run dev`, or the launch
   configuration when working in a tool that provides one).
2. Open the changed route. Read the page structure and console, not only a screenshot.
3. Perform the changed action with realistic data. Observe the network request and the
   response status, the resulting UI state, and the server log line.
4. Check the three states where a fetch is involved: loading (throttle or observe), error
   (stop the backend or use a failing id), empty (an empty list or a missing record).
5. For a multi-locale app, repeat the route in a right-to-left locale and confirm `dir`, the
   heading text and the mirrored layout.
6. Sign-in flows use the repository's seeded test accounts on local hosts only.

## 4. Capture evidence

For each claim, one artefact: the final lines of the gate output, a screenshot of the changed
screen, the request line with its status, or the server log. Keep file paths to the artefacts;
do not paste whole logs into the report.

## 5. Report

Lead with anything that failed or could not be checked. Then a table of gate, result and
evidence; then the manual checks as route, action, observation; then what was not covered and
why. Never write "should work". Write what you saw.
