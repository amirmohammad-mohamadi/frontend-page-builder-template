---
description: Commit the in-scope work with a one-line imperative message after the quality gates pass
argument-hint: [optional commit message]
allowed-tools: Bash(git status *), Bash(git diff *), Bash(git add *), Bash(git commit *), Bash(git branch *), Bash(git checkout -b *), Bash(git switch -c *), Bash(npm run *), Bash(npx nx *), Read, Grep, Glob
disable-model-invocation: true
---

Create a checkpoint commit following `rules/general/git-workflow.md`.

Current state:

!`git status --short --branch`

Steps:

1. Read the diff and list what is in scope for the current task and what is not. Unrelated
   edits stay unstaged; say which files you left out and why.
2. Run the quality gates (`/check`, or the project's aggregate script named in `AGENTS.md`). Do
   not commit while a gate is red; fix or report.
3. If the repository uses pull requests and you are on the default branch, create a feature
   branch first.
4. Stage only the in-scope files and commit. The message follows the commit section of the rule
   above; use `$ARGUMENTS` as the message when given, otherwise write one that names the change,
   not the files.
5. Report the commit hash, the message, and anything left uncommitted.
