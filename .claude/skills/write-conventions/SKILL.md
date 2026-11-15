---
name: write-conventions
description: How to write and maintain the convention documents of a repository (AGENTS.md at root and per app, docs/, .claude/rules, .env.example) so that each fact lives in exactly one place, files stay short, and agents and people read the same source. Use when adding or changing a convention, when documentation and code disagree, or when an AGENTS.md has grown past what a reader can hold.
---

# Write conventions

Conventions are code: single-sourced, reviewed, and deleted when wrong. This skill decides
where a sentence belongs and how it is written.

## Where a fact lives

| Fact                                                          | Lives in                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| repository shape, layer table, commands, how to add things    | root `AGENTS.md`                                                 |
| rules specific to one app or lib                              | that folder's `AGENTS.md`                                        |
| a procedure longer than a paragraph (auth, builder, deploy)   | `docs/<topic>.md`, linked from `AGENTS.md`                       |
| an environment variable                                       | `.env.example` (one line) and `docs/environment.md`              |
| a stack-wide rule that holds in every repository of the stack | `.claude/rules/nx-nextjs/` or `general/`                         |
| a rule that only this repository has                          | `AGENTS.md`, not `.claude/rules`                                 |
| a pitfall that cost time once                                 | one sentence in the file that governs that area, with the reason |
| how to run or verify something right now                      | a command or skill, not prose in `AGENTS.md`                     |

`CLAUDE.md` contains only `@AGENTS.md`. Other agent tools read `AGENTS.md` directly, so the
two never diverge.

## How to write a rule

- One sentence that says what to do, one clause that says why when the why is not obvious.
  Bold the lead words so the list scans.
- State the rule, then the single sanctioned exception, then the file that enforces it if one
  exists (ESLint entry, hook, test).
- Name files by path; name commands in a code block. Do not paste code that the reader can open.
- No history ("we used to"), no dates, no people. If a date matters, it belongs in a commit
  message or a changelog.
- Prefer deleting a rule to softening it. A rule with "usually" in it is advice, not a rule.

## Keeping files short

- Root `AGENTS.md` under about 120 lines; app files under about 100. When a section outgrows
  that, move it to `docs/<topic>.md` and leave a one-line pointer.
- When two files say the same thing, keep the more canonical one and replace the other with a
  pointer. Duplicates drift.
- Review the file top to bottom once a quarter or after any large feature: remove rules the
  code no longer needs, add the ones the review found missing.

## When documentation and code disagree

1. Decide which is right by reading the tests and the recent history, not by preference.
2. Fix the wrong side in the same change. If the code is wrong and out of scope, fix the
   document to say what the code does and open a follow-up for the code.
3. Say in the report which side you changed and why.
