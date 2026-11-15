# Git workflow

The hard rules for commits, branches and pushes. The `/checkpoint`, `/publish` and `/sync`
commands are the only sanctioned ways to run these steps; they point back here.

## Commit messages

- One line, imperative mood, no trailing period: `Add roles permissions drawer`.
- No body, no bullet list of the diff, no "Highlights" section.
- No attribution of any kind: no co-author trailer, no "generated with" line, no tool or model
  name. This applies to commit messages, pull request titles and pull request descriptions.
  `hooks/guard-bash.mjs` refuses a commit command that carries one.
- No emoji unless the repository's own history uses them.
- The author is the developer running the agent. If a commit landed under another identity, fix
  it with `git commit --amend --reset-author` before pushing.

## What goes into a commit

- Only what is in scope for the current task. Unrelated edits wait for their own commit.
- The quality gates in `rules/general/quality-gates.md` pass before the commit is made.
- Generated files that the toolchain rewrites on every run (for example an agent-rules block a
  dev server re-adds) are committed with the work rather than left as permanent noise.

## Branches and pushes

- Never commit directly on the default branch when the repository uses pull requests; branch
  first. When the user has said that the default branch is the working branch, say so in the
  report and continue.
- Never force-push. If the remote has diverged, stop and ask; do not rebase shared history
  without an explicit instruction.
- Never bypass hooks (`--no-verify`) or signing.
- Pushing, creating repositories and opening pull requests are outward-facing actions: do them
  only when the user asked for them in this task.

## Pull requests

- Title is the one-line commit style. Description is a short plain paragraph: what changed and
  how it was verified.
- Open as draft unless told otherwise.
