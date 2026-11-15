---
paths:
  - "e2e/**"
  - "**/*.spec.ts"
  - "**/playwright.config.*"
---

# End-to-end tests

Playwright suites that run against the real apps and the mock API. They are part of the
quality gates for any user-visible flow (`rules/general/quality-gates.md`).

## What a test covers

- One user flow per test, named as the user would describe it ("create a page, publish it and
  see it on the site"). A new user-visible feature ships with its flow.
- Assert on what the user sees: role-based locators (`getByRole`, `getByLabel`), visible text,
  the URL, the HTTP status. Avoid CSS selectors and test ids unless no accessible handle exists;
  when a test id is unavoidable, add it to the component, not to a wrapper.
- Multi-locale apps assert the right-to-left locale at least once per suite: `dir="rtl"` on the
  document and the translated heading.

## Isolation

- The suite starts its own servers through the Playwright `webServer` configuration and never
  reuses a running mock API, so state from a developer's session cannot leak in. State lives in
  a dedicated folder that is wiped before each run and ignored by git.
- Stateless servers (the Next.js apps) may be reused. Say so in the config comment, including
  which port must be free before `npm run e2e`.
- Tests that share a record run serially inside one file and clean up what they created;
  everything else runs in parallel.

## Stability

- Wait for hydration before submitting a form on a cold dev server; a form submitted before
  React takes over falls back to a plain GET.
- Prefer `expect.poll` and locator auto-waits to fixed sleeps. A fixed sleep is a bug report
  waiting to happen.
- A flaky test is fixed or deleted the day it flakes. `test.fail()` marks a known product bug
  with a comment naming it, never a flaky test, and is removed with the fix.

## In CI

- Browsers are installed with `npx playwright install --with-deps chromium` and cached by
  Playwright version. Reports and traces upload on failure only.
- The suite runs after the static gates, not instead of them.
