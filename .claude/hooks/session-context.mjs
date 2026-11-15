#!/usr/bin/env node
/**
 * SessionStart hook. Prints a short orientation that Claude Code adds to the session context:
 * branch and remote state, uncommitted work, the last commit, the gate script, and the verbs
 * this configuration provides. Plain text on stdout is the contract for SessionStart.
 *
 * Fast and silent on failure: outside a git repository it prints only the verbs.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const lines = [];

function git(args) {
  try {
    return execSync(`git ${args}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const branch = git("rev-parse --abbrev-ref HEAD");
if (branch) {
  const upstream = git("rev-parse --abbrev-ref --symbolic-full-name @{upstream}");
  let remote = "no upstream";
  if (upstream) {
    const counts = git("rev-list --left-right --count HEAD...@{upstream}").split(/\s+/);
    remote = `${upstream}, ahead ${counts[0] ?? 0}, behind ${counts[1] ?? 0}`;
  }
  const dirty = git("status --porcelain").split(/\r?\n/).filter(Boolean).length;
  const last = git("log -1 --format=%h%x20%s");
  lines.push(
    `Repository: branch ${branch} (${remote}); ${dirty} uncommitted file(s); last commit: ${last || "none"}.`
  );
}

try {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const scripts = pkg.scripts ?? {};
  const gate = ["check", "verify", "validate"].find((s) => scripts[s]);
  const extras = ["e2e", "check:words", "format:check"].filter((s) => scripts[s]);
  if (gate || extras.length) {
    lines.push(
      `Quality gates: ${gate ? `npm run ${gate}` : "no aggregate script"}${extras.length ? `; also ${extras.map((s) => `npm run ${s}`).join(", ")}` : ""}.`
    );
  }
} catch {
  /* no package.json at the root */
}

if (existsSync(join(root, "AGENTS.md")))
  lines.push(
    "Conventions: read AGENTS.md first, then the nearest nested AGENTS.md; .claude/rules load automatically."
  );
lines.push(
  "Verbs: /check (gates), /review (diff review), /checkpoint (commit in-scope work), /publish (push + draft PR), /sync (reconcile with remote)."
);

process.stdout.write(lines.join("\n") + "\n");
