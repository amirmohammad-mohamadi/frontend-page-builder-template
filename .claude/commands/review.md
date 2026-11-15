---
description: Review the current diff against the repository's conventions with the architecture and i18n reviewer agents
argument-hint: [base ref, default: the default branch]
allowed-tools: Bash(git diff *), Bash(git log *), Bash(git merge-base *), Bash(git status *), Agent, Read, Grep, Glob
---

Review the change set against the rules in `.claude/rules/` and the repository's `AGENTS.md`.
Base ref: `$ARGUMENTS` (when empty, the default branch).

Working tree:

!`git status --short --branch`

1. Compute the change set with `git diff --stat <merge-base>` plus untracked files.
2. Launch the `architecture-reviewer` agent on the diff. Launch the `i18n-rtl-reviewer` agent
   as well when the diff touches app pages, components, styles or message files. Give each the
   base ref and the list of changed files; do not give them your own conclusions.
3. Merge their findings, drop duplicates, and verify each finding against the code before
   reporting it.
4. Report findings ranked by severity: file and line, the rule it breaks (by rule file name),
   the concrete failure scenario. No style nits that Prettier or ESLint would catch.
5. Do not apply fixes in this command; list them for the caller to decide.
