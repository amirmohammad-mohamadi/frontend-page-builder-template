#!/usr/bin/env node
/**
 * PreToolUse hook for Read, Grep, Edit, Write, MultiEdit and NotebookEdit.
 *
 * Enforces the file-level part of `rules/general/secrets-and-environment.md`:
 *   - secret-bearing files are never read, searched or written (`.env*` except the example
 *     file, private keys, credential files, the machine-local word list);
 *   - generated and vendored trees are never edited by hand (`node_modules`, `.git`, build
 *     output of the toolchain, lockfiles).
 *
 * Reads of lockfiles and build output stay allowed; only edits are refused. Shell reads
 * (`cat .env`) are handled by `guard-bash.mjs`.
 */
import { decide, guard, normalizePath, readPayload } from "./_lib.mjs";

const SECRET_FILES = [
  /(^|\/)\.env(\.[\w.-]+)?$/i, // .env, .env.local, .env.production ...
  /(^|\/)\.check-words\.local$/i,
  /(^|\/)(id_rsa|id_ed25519|id_ecdsa)$/i,
  /\.(pem|key|p12|pfx|jks|keystore)$/i,
  /(^|\/)(credentials|service-account)[\w.-]*\.json$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.netrc$/i,
  /(^|\/)\.(git-credentials|pgpass)$/i,
];
const SECRET_EXCEPTIONS = [/(^|\/)\.env\.(example|sample|template)$/i];

// Generated trees are matched by the names the toolchain itself produces, not by generic words
// such as `build` or `out` that an app route may legitimately use.
const NO_EDIT = [
  /(^|\/)node_modules\//,
  /(^|\/)\.git\//,
  /(^|\/)(dist|coverage|\.next|\.nx|\.turbo|playwright-report|test-results)\//,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/,
];

guard(() => {
  const payload = readPayload();
  const tool = payload.tool_name ?? "";
  const input = payload.tool_input ?? {};
  // A Grep whose glob singles out secret files is a read of them.
  if (
    tool === "Grep" &&
    typeof input.glob === "string" &&
    /\.env(?!\.example)|\.pem|\.key/i.test(input.glob)
  ) {
    decide(
      "deny",
      `Searching secret files (${input.glob}). rules/general/secrets-and-environment.md.`
    );
  }

  const file = normalizePath(input.file_path ?? input.notebook_path ?? input.path ?? "");
  if (!file) return;

  const isSecret =
    SECRET_FILES.some((re) => re.test(file)) && !SECRET_EXCEPTIONS.some((re) => re.test(file));
  if (isSecret) {
    decide(
      "deny",
      `${file} may hold secrets. rules/general/secrets-and-environment.md: read .env.example instead, and ask the user for any value that matters.`
    );
  }

  const isEdit = !["Read", "Grep"].includes(tool);
  if (isEdit && NO_EDIT.some((re) => re.test(file))) {
    decide(
      "deny",
      `${file} is generated or vendored. Change the source that produces it (package.json, the build, the generator) instead of editing it by hand.`
    );
  }
});
