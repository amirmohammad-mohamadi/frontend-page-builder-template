#!/usr/bin/env node
/**
 * Validates this configuration folder (or an installed `.claude/` folder) against the Claude
 * Code conventions it relies on:
 *
 *   - agents/*.md       frontmatter with `name` and `description`; valid `model`; `skills` exist
 *   - commands/*.md     frontmatter with `description`; no skill-only keys
 *   - skills/<n>/SKILL.md  `name` equals the folder; description within limits; body < 500 lines;
 *                       linked files and ${CLAUDE_SKILL_DIR} paths exist
 *   - rules/**\/*.md    a title; `paths` frontmatter, when present, is a list or string
 *   - settings.json     strict JSON; known hook events; every hook script exists; `$schema` set
 *   - hooks/*.mjs       parse under `node --check`
 *   - every `rules/…`, `skills/…`, `commands/…`, `agents/…`, `hooks/…` path mentioned in a
 *     Markdown file exists
 *   - no forbidden text: attribution lines, debug logging, email addresses, internal service
 *     hosts, plus any words from an optional list (`--words <file>`, one word or `/regex/` per
 *     line; the file itself is never printed), so project and company names stay out
 *
 *   node scripts/validate.mjs                       # validate this folder
 *   node scripts/validate.mjs /repo/.claude         # validate an installed copy
 *   node scripts/validate.mjs . --words ~/.private-words
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EOL = String.fromCharCode(10);
const argv = process.argv.slice(2);
const wordsIndex = argv.indexOf("--words");
const wordsFile = wordsIndex === -1 ? null : argv[wordsIndex + 1];
const positional = argv.filter((a, i) => a !== "--words" && i !== wordsIndex + 1);
const root = resolve(positional[0] ?? join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const problems = [];
const inventory = [];

const HOOK_EVENTS = new Set([
  "SessionStart",
  "Setup",
  "UserPromptSubmit",
  "UserPromptExpansion",
  "PreToolUse",
  "PermissionRequest",
  "PermissionDenied",
  "PostToolUse",
  "PostToolUseFailure",
  "PostToolBatch",
  "Notification",
  "MessageDisplay",
  "SubagentStart",
  "SubagentStop",
  "TaskCreated",
  "TaskCompleted",
  "Stop",
  "StopFailure",
  "TeammateIdle",
  "InstructionsLoaded",
  "ConfigChange",
  "CwdChanged",
  "DirectoryAdded",
  "FileChanged",
  "WorktreeCreate",
  "WorktreeRemove",
  "PreCompact",
  "PostCompact",
  "PreModelSwitch",
  "PostModelSwitch",
  "Elicitation",
  "ElicitationResult",
  "SessionEnd",
]);
const AGENT_MODELS = new Set(["sonnet", "opus", "haiku", "fable", "inherit"]);

// Generic patterns only. Project, company and person names come from the optional words file,
// so this script can be committed to any repository without carrying them. Literals that a
// repository's own word gate may forbid are assembled from fragments.
const w = (...parts) => parts.join("");
const FORBIDDEN = [
  [new RegExp(w("co-auth", "ored-by"), "i"), "attribution trailer"],
  [new RegExp(w("generated with \\[?cl", "aude"), "i"), "attribution line"],
  [new RegExp(w("console\\.l", "og\\(")), "debug logging"],
  [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, "email address"],
  [
    /https?:\/\/(?!localhost|127\.0\.0\.1|\[::1\]|json\.schemastore\.org|code\.claude\.com)[\w.-]+\.(?:local|internal|corp|lan)\b/i,
    "internal service host",
  ],
  [
    /\b(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)\b/,
    "private IP address",
  ],
  [/[A-Z]:\\[\w\\ .-]+/, "absolute Windows path"],
  [/\/(?:Users|home)\/[\w.-]+\//, "absolute home path"],
];
if (wordsFile) {
  if (!existsSync(wordsFile)) problems.push(`--words file not found: ${wordsFile}`);
  else {
    for (const line of readFileSync(wordsFile, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)) {
      const re =
        line.length > 2 && line.startsWith("/") && line.endsWith("/")
          ? new RegExp(line.slice(1, -1), "i")
          : new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      FORBIDDEN.push([re, "private word"]);
    }
  }
}

const must = (cond, msg) => cond || problems.push(msg);
const rel = (p) => relative(root, p).replace(/\\/g, "/");

/* ----------------------------------- helpers ----------------------------------- */

function walk(dir, filter = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name === "node_modules" || name === ".git") continue;
    if (statSync(full).isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

/** Minimal YAML frontmatter reader: scalars, inline lists, block lists. */
function frontmatter(text) {
  if (!text.startsWith("---")) return { data: null, body: text };
  const end = text.indexOf(EOL + "---", 3);
  if (end === -1) return { data: null, body: text };
  const block = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\r?\n/, "");
  const data = {};
  let current = null;
  for (const raw of block.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && current) {
      (data[current] = Array.isArray(data[current]) ? data[current] : []).push(unquote(item[1]));
      continue;
    }
    const kv = raw.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) {
      problems.push(`frontmatter line not understood: "${raw}"`);
      continue;
    }
    current = kv[1];
    const value = kv[2].trim();
    if (value === "") data[current] = [];
    else if (value.startsWith("["))
      data[current] = value
        .slice(1, -1)
        .split(",")
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
    else data[current] = unquote(value);
  }
  return { data, body };
}
const unquote = (s) => s.replace(/^["']|["']$/g, "");
const listOrString = (v) => typeof v === "string" || Array.isArray(v);

/* ------------------------------------ agents ------------------------------------ */

const skillNames = new Set(
  existsSync(join(root, "skills"))
    ? readdirSync(join(root, "skills")).filter((n) =>
        statSync(join(root, "skills", n)).isDirectory()
      )
    : []
);
const agentNames = new Set();
for (const file of walk(join(root, "agents"), (f) => f.endsWith(".md"))) {
  const r = rel(file);
  inventory.push(r);
  const { data } = frontmatter(readFileSync(file, "utf8"));
  must(data, `${r}: missing frontmatter`);
  if (!data) continue;
  must(
    typeof data.name === "string" &&
      data.name.length > 0 &&
      data.name.length <= 256 &&
      !data.name.includes(":") &&
      !data.name.startsWith("-"),
    `${r}: invalid or missing name`
  );
  must(
    typeof data.description === "string" && data.description.length > 20,
    `${r}: description missing or too short`
  );
  must(!agentNames.has(data.name), `${r}: duplicate agent name ${data.name}`);
  agentNames.add(data.name);
  if (data.model !== undefined)
    must(
      AGENT_MODELS.has(data.model) || /^claude-/.test(data.model),
      `${r}: unknown model ${data.model}`
    );
  for (const key of ["tools", "disallowedTools"])
    if (data[key] !== undefined)
      must(listOrString(data[key]), `${r}: ${key} must be a string or list`);
  for (const s of [].concat(data.skills ?? []))
    must(skillNames.has(s), `${r}: preloads unknown skill ${s}`);
  for (const key of Object.keys(data))
    must(/^[a-z][A-Za-z.]*$/.test(key), `${r}: agent frontmatter keys are camelCase (${key})`);
}

/* ----------------------------------- commands ----------------------------------- */

for (const file of walk(join(root, "commands"), (f) => f.endsWith(".md"))) {
  const r = rel(file);
  inventory.push(r);
  const { data, body } = frontmatter(readFileSync(file, "utf8"));
  must(data, `${r}: missing frontmatter`);
  if (!data) continue;
  must(
    typeof data.description === "string" && data.description.length > 10,
    `${r}: description missing`
  );
  must(
    data.name === undefined && data.paths === undefined,
    `${r}: commands do not support name or paths`
  );
  if (data["allowed-tools"] !== undefined)
    must(listOrString(data["allowed-tools"]), `${r}: allowed-tools must be a string or list`);
  must(body.trim().length > 50, `${r}: body is empty`);
  if (/\$\{ARGUMENTS/.test(body))
    problems.push(`${r}: \${ARGUMENTS...} shell expansion mixes with the $ARGUMENTS placeholder`);
  for (const m of body.matchAll(/^!`([^`]+)`/gm)) {
    if (/\$ARGUMENTS/.test(m[1]))
      problems.push(`${r}: $ARGUMENTS inside a bash injection is not reliably substituted`);
  }
}

/* ------------------------------------ skills ------------------------------------ */

for (const name of skillNames) {
  const dir = join(root, "skills", name);
  const file = join(dir, "SKILL.md");
  const r = rel(file);
  must(existsSync(file), `${r}: missing`);
  if (!existsSync(file)) continue;
  for (const f of walk(dir)) inventory.push(rel(f));
  const text = readFileSync(file, "utf8");
  const { data, body } = frontmatter(text);
  must(data, `${r}: missing frontmatter`);
  if (!data) continue;
  must(!data.name || data.name === name, `${r}: name "${data.name}" differs from folder "${name}"`);
  must(/^[a-z0-9][a-z0-9-]*$/.test(name), `${r}: folder name should be lowercase kebab-case`);
  must(
    typeof data.description === "string" && data.description.length > 20,
    `${r}: description missing or too short`
  );
  const descLen = (data.description ?? "").length + (data.when_to_use ?? "").length;
  must(
    descLen <= 1536,
    `${r}: description + when_to_use is ${descLen} chars; listing truncates at 1536`
  );
  must(body.split(/\r?\n/).length < 500, `${r}: body over 500 lines; move detail to linked files`);
  for (const m of body.matchAll(/\]\(([^)#:]+)\)/g))
    must(existsSync(join(dir, m[1])), `${r}: link target ${m[1]} does not exist`);
  for (const m of body.matchAll(/\$\{CLAUDE_SKILL_DIR\}\/([\w./-]+)/g))
    must(existsSync(join(dir, m[1])), `${r}: ${m[0]} does not exist`);
}

/* ------------------------------------- rules ------------------------------------- */

for (const file of walk(join(root, "rules"), (f) => f.endsWith(".md"))) {
  const r = rel(file);
  inventory.push(r);
  const { data, body } = frontmatter(readFileSync(file, "utf8"));
  if (data) {
    for (const key of Object.keys(data))
      must(key === "paths", `${r}: rules only support a paths frontmatter (found ${key})`);
    if (data.paths !== undefined)
      must(
        listOrString(data.paths) && [].concat(data.paths).length > 0,
        `${r}: paths must be a non-empty list or string`
      );
  }
  must(/^# .+/m.test(body), `${r}: no title heading`);
  must(body.trim().split(/\r?\n/).length >= 8, `${r}: suspiciously short`);
}

/* ------------------------------------ settings ------------------------------------ */

const hookScripts = new Set(
  walk(join(root, "hooks"), (f) => f.endsWith(".mjs")).map((f) => basename(f))
);
for (const settingsFile of [
  join(root, "settings.json"),
  join(root, "hooks", "optional.settings.json"),
]) {
  if (!existsSync(settingsFile)) continue;
  const r = rel(settingsFile);
  inventory.push(r);
  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsFile, "utf8"));
  } catch (error) {
    problems.push(`${r}: not strict JSON (${error.message})`);
    continue;
  }
  if (r === "settings.json")
    must(typeof settings.$schema === "string", `${r}: add $schema for editor validation`);
  for (const [event, entries] of Object.entries(settings.hooks ?? {})) {
    must(HOOK_EVENTS.has(event), `${r}: unknown hook event ${event}`);
    must(Array.isArray(entries), `${r}: hooks.${event} must be an array`);
    for (const entry of entries ?? []) {
      if (entry.matcher !== undefined)
        must(typeof entry.matcher === "string", `${r}: ${event} matcher must be a string`);
      for (const h of entry.hooks ?? []) {
        must(
          ["command", "http", "mcp_tool", "prompt", "agent"].includes(h.type),
          `${r}: ${event} hook type ${h.type} unknown`
        );
        if (h.type === "command") {
          const script = h.command.match(/\.claude\/hooks\/([\w.-]+\.mjs)/)?.[1];
          must(
            script && hookScripts.has(script),
            `${r}: ${event} references hook script ${script ?? h.command}, which is not in hooks/`
          );
          must(
            /\$\{CLAUDE_PROJECT_DIR\}/.test(h.command),
            `${r}: ${event} command should resolve through \${CLAUDE_PROJECT_DIR}`
          );
        }
      }
    }
  }
  const perms = settings.permissions ?? {};
  for (const key of ["allow", "ask", "deny"])
    for (const rule of perms[key] ?? [])
      must(/^[A-Za-z]+(\(.+\))?$/.test(rule), `${r}: permission rule "${rule}" is malformed`);
  for (const rule of perms.deny ?? [])
    if (/Read\(\.\/\.env\.\*\)/.test(rule))
      problems.push(`${r}: Read(./.env.*) would also deny .env.example`);
}

/* ------------------------------------- hooks ------------------------------------- */

for (const file of walk(join(root, "hooks"), (f) => f.endsWith(".mjs"))) {
  const r = rel(file);
  inventory.push(r);
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    problems.push(`${r}: does not parse: ${String(error.stderr).split(EOL)[0]}`);
  }
}
for (const name of ["protect-sensitive-files.mjs", "guard-bash.mjs", "session-context.mjs"])
  must(hookScripts.has(name), `hooks/${name}: expected hook script missing`);

/* -------------------------------- cross references -------------------------------- */

const mdFiles = walk(
  root,
  (f) => f.endsWith(".md") && !/(^|[\\/])(REPORT|node_modules)/.test(rel(f))
);
for (const file of mdFiles) {
  const r = rel(file);
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(
    /`(?:\.claude\/)?((?:rules|skills|commands|agents|hooks|scripts|examples)\/[\w./-]+)`/g
  )) {
    const target = join(root, m[1]);
    const partial =
      existsSync(dirname(target)) &&
      readdirSync(dirname(target)).some((n) => n.startsWith(basename(target)));
    must(existsSync(target) || partial, `${r}: mentions ${m[1]}, which does not exist`);
  }
}

/* -------------------------------- forbidden text -------------------------------- */

for (const file of walk(root, (f) => /\.(md|mjs|json)$/.test(f))) {
  const r = rel(file);
  if (r.startsWith("REPORT")) continue;
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      for (const [re, why] of FORBIDDEN)
        if (re.test(line))
          problems.push(`${r}:${i + 1}: forbidden (${why}): ${line.trim().slice(0, 80)}`);
    });
}

/* ------------------------------------- report ------------------------------------- */

for (const extra of [
  "README.md",
  "examples/CLAUDE.md",
  "examples/AGENTS.md",
  "scripts/validate.mjs",
])
  if (existsSync(join(root, extra))) inventory.push(extra);
// The README belongs to the foundation folder (which also carries examples/); an installed
// `.claude/` copy has neither.
if (existsSync(join(root, "examples")))
  must(existsSync(join(root, "README.md")), "README.md: missing");
for (const dir of ["agents", "rules", "commands", "skills", "hooks"])
  must(existsSync(join(root, dir)), `${dir}/: missing`);

const unique = [...new Set(inventory)].sort();
process.stdout.write(`validated ${root}${EOL}`);
process.stdout.write(
  `${unique.length} files: ${agentNames.size} agents, ${walk(join(root, "commands")).length} commands, ${skillNames.size} skills, ${walk(join(root, "rules")).length} rules, ${hookScripts.size} hook scripts${EOL}`
);
if (problems.length) {
  process.stderr.write(`${EOL}${problems.length} problem(s):${EOL}`);
  for (const p of problems) process.stderr.write(`  - ${p}${EOL}`);
  process.exit(1);
}
process.stdout.write(`no problems found${EOL}`);
