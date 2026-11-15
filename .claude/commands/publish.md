---
description: Push the in-scope commits and open or update a draft pull request, stopping on any divergence
argument-hint: [optional PR title]
allowed-tools: Bash(git status *), Bash(git log *), Bash(git fetch *), Bash(git push *), Bash(git rev-list *), Bash(gh pr create *), Bash(gh pr view *), Bash(gh pr edit *), Bash(gh pr list *), Bash(gh pr status*), Bash(gh pr checks *), Read
disable-model-invocation: true
---

Publish the current branch following `rules/general/git-workflow.md`.

Branch and remote state:

!`git status --short --branch && git log --oneline -5`

Steps:

1. Fetch. If the remote branch exists and has commits that are not in the local branch, stop
   and ask; never force-push and never rebase shared history on your own.
2. Confirm every commit to be pushed satisfies the commit section of the rule above. If one does
   not, stop and report it; do not rewrite history unasked.
3. Push with upstream tracking.
4. Open a draft pull request, or update the existing one, as the pull-request section of the
   rule describes; `$ARGUMENTS` is the title when given.
5. Report the pull request URL and the CI status once it is known.
