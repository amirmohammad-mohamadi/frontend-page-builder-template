---
description: Fetch and reconcile the branch with its remote, then push, asking before any non-trivial merge or rebase
allowed-tools: Bash(git status *), Bash(git fetch *), Bash(git log *), Bash(git rev-list *), Bash(git merge *), Bash(git rebase *), Bash(git push *), Bash(git stash *), Read
disable-model-invocation: true
---

Synchronise the branch following `rules/general/git-workflow.md`.

State:

!`git fetch --quiet 2>/dev/null; git status --short --branch`

Steps:

1. If the working tree is dirty, stop and ask whether to checkpoint or stash first.
2. Compare local and remote. Fast-forward when possible.
3. When both sides have commits, describe the divergence (counts and subjects) and ask whether
   to merge or rebase. Rebase only a branch nobody else has pushed to, and only with an explicit
   yes. Never force-push.
4. Resolve conflicts only when the resolution is mechanical; otherwise list them and stop.
5. Push, then report the resulting state.
