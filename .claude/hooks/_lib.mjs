/**
 * Shared helpers for the hook scripts. Every hook reads one JSON object on stdin (the event
 * payload Claude Code sends) and answers either with nothing (allow) or with a JSON decision on
 * stdout. Hooks must never throw: an unexpected error is logged to stderr and the action
 * proceeds, so a broken hook can never lock the user out of their own repository.
 */
import { readFileSync } from "node:fs";

/** Reads and parses the hook payload from stdin; returns `{}` when there is none. */
export function readPayload() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Answers a PreToolUse event with a permission decision and exits.
 *
 * @param {"allow"|"deny"|"ask"} decision what Claude Code should do with the tool call
 * @param {string} reason shown to Claude (and to the user on `ask`); name the rule file
 */
export function decide(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

/** Normalises a path for matching: forward slashes, no drive-letter casing surprises. */
export function normalizePath(path) {
  return String(path ?? "")
    .replace(/\\/g, "/")
    .replace(/^[A-Za-z]:/, (d) => d.toLowerCase());
}

/** Runs `fn` and swallows anything it throws, so the hook degrades to "allow". */
export function guard(fn) {
  try {
    fn();
  } catch (error) {
    process.stderr.write(`hook error (ignored): ${error?.message ?? error}\n`);
    process.exit(0);
  }
}
