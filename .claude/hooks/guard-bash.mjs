#!/usr/bin/env node
/**
 * PreToolUse hook for the Bash and PowerShell tools.
 *
 * Enforces the mechanical part of `rules/general/git-workflow.md` and
 * `rules/general/secrets-and-environment.md`, and refuses the handful of shell commands that
 * destroy work:
 *   deny  force pushes (flag or `+ref` refspec), hook bypasses, history rewrites, recursive
 *         deletes of the repository, home or root, reading secret files through the shell,
 *         commit messages with a body, a trailing period or an attribution line;
 *   ask   amends, hard resets, discarding the working tree, force branch deletion, stash drops,
 *         publishing a package, deleting or archiving a repository.
 *
 * A command line is split on `&&`, `||`, `;` and `|` and every simple command is judged on its
 * own, so two commits chained on one line are two one-line messages, not one multi-line one.
 * Quoted strings are blanked before the destructive-command checks, so a commit message that
 * mentions `--no-verify` is not refused. The hook inspects text only; it cannot see what a
 * script file does.
 */
import { decide, guard, readPayload } from "./_lib.mjs";

// The literal trailer name is assembled at run time so the word gate of a repository that
// forbids it in committed text does not trip over this file.
const ATTRIBUTION = new RegExp(["co-authored", "-by", "|generated[- ]with|🤖"].join(""), "i");
const GIT_RULE = "rules/general/git-workflow.md";
const SECRETS_RULE = "rules/general/secrets-and-environment.md";

/** Blanks the inside of quoted strings so flags inside messages or file names are ignored. */
const blankQuotes = (cmd) =>
  cmd.replace(
    /"(?:\\.|[^"\\])*"|'[^']*'/g,
    (m) => m[0] + " ".repeat(Math.max(0, m.length - 2)) + m[0]
  );

/**
 * Splits a command line on `&&`, `||`, `;` and `|` found outside quotes. Returns pairs of the
 * blanked segment (for flag checks) and the original segment (for reading message text).
 */
function splitSegments(command) {
  const blanked = blankQuotes(command);
  const separator = /\s*(?:&&|\|\||;|\|)\s*/g;
  const pairs = [];
  let last = 0;
  let m;
  while ((m = separator.exec(blanked))) {
    pairs.push([blanked.slice(last, m.index), command.slice(last, m.index)]);
    last = m.index + m[0].length;
  }
  pairs.push([blanked.slice(last), command.slice(last)]);
  return pairs;
}

/** True when `re` appears as a whole flag token in the segment. */
const hasFlag = (seg, re) => new RegExp(`(?:^|\\s)${re.source}(?=\\s|$)`).test(seg);
/** Matches `git <sub>`, allowing global options such as `-c key=value` or `-C dir` before the subcommand. */
const gitCmd = (sub) => new RegExp(`^\\s*git\\s+(?:(?:-c|-C)\\s+\\S+\\s+|-\\S+\\s+)*(?:${sub})\\b`);
const ROOT_VAR = "\\$\\{?(?:CLAUDE_PROJECT_DIR|HOME|PWD)\\}?";

function isForcePush(seg) {
  if (!gitCmd("push").test(seg)) return false;
  return (
    hasFlag(seg, /--force(?:-with-lease|-if-includes)?(?:=\S+)?/) ||
    hasFlag(seg, /-[a-zA-Z]*f[a-zA-Z]*/) ||
    /\s\+\S+/.test(seg)
  );
}

function isRecursiveDeleteOfEverything(seg, original) {
  const m = seg.match(/^\s*rm\s+(.*)$/);
  if (!m) return false;
  const tokens = m[1].split(/\s+/).filter(Boolean);
  const flags = tokens.filter((t) => t.startsWith("-"));
  const targets = tokens.filter((t) => !t.startsWith("-"));
  const recursive = flags.some(
    (f) => f === "--recursive" || f === "-R" || /^-[a-zA-Z]*r[a-zA-Z]*$/.test(f)
  );
  const force = flags.some((f) => f === "--force" || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(f));
  if (!recursive || !force) return false;
  const rootLike = new RegExp(
    `^(?:\\/|~\\/?|\\.{1,2}\\/?|\\*|${ROOT_VAR}\\/?\\*?|[A-Za-z]:[\\\\/]?)$`
  );
  if (targets.some((t) => rootLike.test(t))) return true;
  // Quoted targets were blanked; look at the original text for a quoted root variable.
  return new RegExp(`\\brm\\s[^|;&]*["']${ROOT_VAR}\\/?["']`).test(original);
}

function readsSecretFile(seg) {
  const reader =
    /^\s*(?:cat|less|more|head|tail|bat|type|Get-Content|gc|strings|xxd|base64)\s+(.*)$/i.exec(seg);
  if (!reader) return false;
  return reader[1]
    .split(/\s+/)
    .some(
      (t) =>
        (/(^|[\\/])\.env(\.[\w.-]+)?$/i.test(t) && !/\.env\.(example|sample|template)$/i.test(t)) ||
        /(^|[\\/])\.check-words\.local$/i.test(t) ||
        /\.(pem|key|p12|pfx)$/i.test(t) ||
        /(^|[\\/])id_(rsa|ed25519|ecdsa)$/i.test(t)
    );
}

/** Returns the reason a `git commit` segment is refused, or null. Reads messages from the original segment. */
function commitMessageIssues(seg, original) {
  if (!gitCmd("commit").test(seg)) return null;
  if (hasFlag(seg, /--no-verify|-n/) || /-c\s+core\.hooksPath=/i.test(seg)) {
    return `hook bypass on commit. ${GIT_RULE}: never bypass hooks.`;
  }
  if (hasFlag(seg, /-F|--file(?:=\S+)?/)) {
    return `commit message from a file. ${GIT_RULE}: one line, written inline with -m.`;
  }
  const messages = [];
  const re = /(?:^|\s)(?:-[a-zA-Z]*m|--message)(?:=|\s*)(?:"((?:\\.|[^"\\])*)"|'([^']*)'|(\S+))/g;
  for (const m of original.matchAll(re))
    messages.push((m[1] ?? m[2] ?? m[3] ?? "").replace(/\\"/g, '"'));
  const heredoc = original.match(/<<-?\s*['"]?(\w+)['"]?[^\n]*\n([\s\S]*?)\n\1\b/);
  if (heredoc) {
    // A heredoc is one message; drop the -m capture that merely wraps it.
    const plain = messages.filter((m) => !m.includes("<<"));
    messages.length = 0;
    messages.push(...plain, heredoc[2].trim());
  }
  if (!messages.length) return null;
  if (messages.length > 1)
    return `multi-line commit message (several -m). ${GIT_RULE}: one line, no body.`;
  const text = messages[0];
  if (ATTRIBUTION.test(text)) {
    return `attribution in a commit message. ${GIT_RULE}: no co-author trailers, no generated-with lines, no tool names.`;
  }
  if (/\n\s*\S/.test(text)) return `multi-line commit message. ${GIT_RULE}: one line, no body.`;
  if (/\.\s*$/.test(text))
    return `commit message ends with a period. ${GIT_RULE}: one line, no trailing period.`;
  return null;
}

const DENY = [
  [
    (s) => isForcePush(s),
    `force push. ${GIT_RULE}: never force-push; stop and ask when the remote diverged.`,
  ],
  [
    (s) => gitCmd("push|merge|rebase").test(s) && hasFlag(s, /--no-verify/),
    `hook bypass. ${GIT_RULE}: never bypass hooks or signing.`,
  ],
  [
    (s) => gitCmd("commit").test(s) && hasFlag(s, /--no-gpg-sign/),
    `signing bypass. ${GIT_RULE}: never bypass hooks or signing.`,
  ],
  [
    (s) => gitCmd("filter-branch|filter-repo").test(s),
    "history rewrite. Shared history is rewritten only by a person, deliberately.",
  ],
  [
    (s, o) => isRecursiveDeleteOfEverything(s, o),
    "recursive delete of the repository, home or root. Delete the specific path you mean.",
  ],
  [
    (s) => gitCmd("clean").test(s) && hasFlag(s, /-[a-zA-Z]*f[a-zA-Z]*|--force/),
    "git clean -f removes untracked files irrecoverably. List them with `git clean -n` and delete the specific ones.",
  ],
  [
    (s) => readsSecretFile(s),
    `reading a secret file through the shell. ${SECRETS_RULE}: read .env.example and ask the user for the value.`,
  ],
];

const ASK = [
  [
    (s) => gitCmd("commit").test(s) && hasFlag(s, /--amend/),
    "amending a commit rewrites it; confirm it was never pushed.",
  ],
  [
    (s) => gitCmd("reset").test(s) && hasFlag(s, /--hard/),
    "hard reset discards working tree changes.",
  ],
  [
    (s) => /^\s*git\s+(checkout|restore)\s+(?:--\s+)?\.\s*$/.test(s),
    "this discards every uncommitted change in the tree.",
  ],
  [
    (s) =>
      gitCmd("branch").test(s) &&
      (hasFlag(s, /-D/) || (hasFlag(s, /--delete/) && hasFlag(s, /--force/))),
    "force-deleting a branch loses unmerged commits.",
  ],
  [
    (s) => gitCmd("stash").test(s) && /\bstash\s+(drop|clear)\b/.test(s),
    "dropped stashes are hard to recover.",
  ],
  [
    (s) => /^\s*(npm|pnpm|yarn(\s+npm)?)\s+publish\b/.test(s),
    "publishing a package is outward-facing and irreversible.",
  ],
  [
    (s) => /^\s*gh\s+repo\s+(delete|archive)\b/.test(s),
    "deleting or archiving a repository is outward-facing.",
  ],
];

guard(() => {
  const payload = readPayload();
  if (!["Bash", "PowerShell"].includes(payload.tool_name)) return;
  const command = String(payload.tool_input?.command ?? "");
  if (!command) return;

  const segments = splitSegments(command);
  for (const [seg, orig] of segments) {
    for (const [test, why] of DENY) if (test(seg, orig)) decide("deny", `Refused: ${why}`);
  }
  for (const [seg, orig] of segments) {
    const issue = commitMessageIssues(seg, orig);
    if (issue) decide("deny", `Refused: ${issue}`);
  }
  for (const [seg] of segments) {
    for (const [test, why] of ASK) if (test(seg)) decide("ask", `Confirm: ${why}`);
  }
});
