# Secrets and environment

What may never reach the repository, and how configuration reaches the code. The hook
`hooks/protect-sensitive-files.mjs` enforces the file-level part mechanically.

## Never in the repository

- Credentials, tokens, licence keys, private hostnames, internal service URLs, customer or
  company names that are not the project's own, and private reports.
- `.env` files. Only `.env.example` is committed, with every variable present and either empty
  or set to a safe local default.
- Anything the repository's word gate rejects. If the project has a `check:words` script, it is
  part of the quality gates; a machine-local list of extra words may exist and is never printed
  or committed.

## Reading configuration

- One validated accessor per app (`env.ts` or equivalent) reads and validates `process.env` at
  startup. Code imports from it; it never reads `process.env` directly.
- Variables prefixed for the browser (`NEXT_PUBLIC_*` or the framework's equivalent) ship to
  every visitor. Use the prefix only for values that are truly public.
- A server-only secret never gets the public prefix, never appears in client code, and never
  appears in a log line.
- Optional integrations (a paid editor, error tracking, analytics) must work in their disabled
  state when their variables are absent. Absence is a supported configuration, not an error.

## Documenting a variable

Every variable appears in `.env.example` with a comment and in the environment document of the
project, stating: what it does, where to obtain it, whether it is public, and whether it is read
at build time or at run time.

## Working with secrets locally

- Do not read `.env` files to answer a question; read `.env.example` and ask the user for the
  value if it matters.
- Do not paste secret values into chat, commit messages, issues or test fixtures.
