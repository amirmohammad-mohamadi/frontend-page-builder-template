#!/usr/bin/env node
/**
 * PostToolUse hook for Edit, Write and MultiEdit (optional; see hooks/optional.settings.json).
 *
 * Runs the repository's own Prettier on the file that was just written, so the format gate
 * never fails on an agent edit. Silent when the repository has no Prettier, when the file type
 * is not formatted, or when Prettier itself fails (the format gate will report that).
 *
 * Trade-off: a file changed by this hook no longer matches what Claude last saw, and the next
 * Edit on it may need a fresh Read. Enable it when the format gate is a recurring annoyance;
 * leave it off when edits are many and small.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { normalizePath, readPayload } from "./_lib.mjs";

const FORMATTED = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".css",
  ".scss",
  ".yml",
  ".yaml",
  ".html",
]);

const payload = readPayload();
const file = normalizePath(payload.tool_input?.file_path ?? "");
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

if (
  !file ||
  !FORMATTED.has(extname(file)) ||
  /(^|\/)(node_modules|dist|\.next|coverage)\//.test(file)
)
  process.exit(0);

// Prettier 3 ships bin/prettier.cjs and takes --log-level; Prettier 2 ships bin-prettier.js and takes --loglevel.
const v3 = join(root, "node_modules/prettier/bin/prettier.cjs");
const v2 = join(root, "node_modules/prettier/bin-prettier.js");
const [bin, quiet] = existsSync(v3)
  ? [v3, "--log-level"]
  : existsSync(v2)
    ? [v2, "--loglevel"]
    : [null, null];
if (!bin) process.exit(0);

spawnSync(process.execPath, [bin, "--write", quiet, "silent", file], {
  cwd: root,
  stdio: "ignore",
  timeout: 20_000,
});
process.exit(0);
