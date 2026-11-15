#!/usr/bin/env node
/**
 * Reports likely right-to-left and i18n defects in source files.
 *
 *   node find-rtl-issues.mjs                    # files changed in the working tree against the default branch
 *   node find-rtl-issues.mjs --diff origin/main # files changed against a ref
 *   node find-rtl-issues.mjs src/app src/features
 *
 * Output: one line per candidate, `path:line  [kind]  excerpt`. Exit code 1 when anything was
 * found, so it can gate a script; the findings still need a human or agent to confirm them.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const SOURCE_EXT = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".css"]);
const JSX_EXT = new Set([".tsx", ".jsx"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "coverage",
  ".nx",
  ".git",
  "test-results",
  "playwright-report",
]);
const EOL = String.fromCharCode(10);

// Spacing utilities need a value (`ml-4`, `pr-[2px]`); keyword utilities take one or stand alone
// where Tailwind defines a bare form (`text-left`, `float-right`). Bare `left`/`right` only count
// with a value (`left-0`), since Tailwind has no bare `left` class and the word is common in prose.
// Variants `rtl:` and `ltr:` are deliberate direction overrides and are not flagged.
const VARIANTS =
  "(?:-?(?:sm|md|lg|xl|2xl|hover|focus|active|disabled|dark|group-hover|peer-focus|first|last):)*";
const CLASS_VALUE = "(?:\\[[^\\]\\s]+\\]|[\\w.]+)";
const PHYSICAL_CLASS = new RegExp(
  `(?<![\\w:-])${VARIANTS}-?(?:(?:ml|mr|pl|pr|scroll-ml|scroll-mr|left|right|inset-x-[lr])-${CLASS_VALUE}|(?:text-left|text-right|float-left|float-right|clear-left|clear-right|rounded-[lr](?:-[a-z]+)?|border-[lr])(?:-${CLASS_VALUE})?)(?![\\w-])`,
  "g"
);
const PHYSICAL_STYLE =
  /\b(?:marginLeft|marginRight|paddingLeft|paddingRight|borderLeft\w*|borderRight\w*)\s*:|textAlign\s*:\s*["'](?:left|right)["']/g;
const PHYSICAL_CSS =
  /(?:margin|padding|border)-(?:left|right)\s*:|text-align\s*:\s*(?:left|right)\b|(?:^|[^-\w])(?:left|right)\s*:\s*[\d-]/;
const CURRENCY =
  /toLocaleString\(\s*["']en-US["']|new Intl\.\w+Format\(\s*["']en-US["']|["'`][$€£¥]\s*\$\{|\$\{[^}]+\}\s*[$€£¥]["'`]/g;
const STRING_PROP =
  /\b(?:placeholder|title|aria-label|alt|label)=\s*"([^"]*[A-Za-z؀-ۿ]{3,}[^"]*)"/g;
const JSX_TEXT = />\s*([^<>{}\n]*[A-Za-z؀-ۿ]{2,}[^<>{}\n]*)\s*</g;
const T_CALL = /\bt\(\s*["'`]([\w.-]+)["'`]/g;

const args = process.argv.slice(2);
let files = [];

if (args[0] === "--diff" || args.length === 0) {
  const base = args[0] === "--diff" ? args[1] : defaultBranch();
  // Working tree against the base: committed, staged and unstaged changes alike, plus new files.
  const out =
    run(`git diff --name-only --diff-filter=ACMR ${base} -- .`) +
    EOL +
    run("git ls-files --others --exclude-standard");
  files = out.split(/\r?\n/).filter(Boolean);
} else {
  for (const arg of args) files.push(...walk(resolve(arg)));
}

files = [...new Set(files.map((f) => resolve(f)))].filter(
  (f) => existsSync(f) && SOURCE_EXT.has(extname(f))
);

const messageDirs = findMessageDirs();
const findings = [];

for (const file of files) {
  const rel = relative(process.cwd(), file).replace(/\\/g, "/");
  const ext = extname(file);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const keysForFile = messagesFor(file);
  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`;
    if (ext === ".css") {
      if (PHYSICAL_CSS.test(line)) findings.push([where, "physical-css", line.trim().slice(0, 80)]);
      return;
    }
    for (const m of line.matchAll(PHYSICAL_CLASS)) {
      if (looksLikeClassList(line, m.index)) findings.push([where, "physical-class", m[0].trim()]);
    }
    if (/style\s*=\s*\{\{|\.style\.|style:\s*\{/.test(line))
      for (const m of line.matchAll(PHYSICAL_STYLE)) findings.push([where, "physical-style", m[0]]);
    for (const m of line.matchAll(CURRENCY))
      findings.push([where, "hardcoded-currency-or-locale", m[0]]);
    if (JSX_EXT.has(ext)) {
      // A literal attribute is inline copy whatever else the line does; a text node is skipped
      // when the line already reads translated or module copy, because the regex cannot tell
      // `{t("x")}` apart from the characters around it.
      for (const m of line.matchAll(STRING_PROP))
        findings.push([where, "inline-string-prop", m[0]]);
      const readsCopy = /\bt\(|TEXTS|texts\./.test(line);
      for (const m of readsCopy ? [] : line.matchAll(JSX_TEXT)) {
        const t = m[1].trim();
        if (!t || /^[\d\s.,:;!?()/-]*$/.test(t)) continue;
        // Type positions and generics (`Promise<A> | B`, `Record<string, X>`) are not text nodes.
        if (
          /[|&]/.test(t) ||
          /^[A-Z]\w*$/.test(t) ||
          /^\s*(import|export|type|interface|const|let|function|return)\b/.test(line)
        )
          continue;
        findings.push([where, "inline-jsx-text", t.slice(0, 60)]);
      }
    }
    if (keysForFile) {
      for (const m of line.matchAll(T_CALL)) {
        const key = m[1];
        const missingIn = [...keysForFile.entries()]
          .filter(([, keys]) => !hasKey(keys, key))
          .map(([locale]) => locale);
        if (missingIn.length)
          findings.push([
            where,
            "missing-message-key",
            `${key} (missing in ${missingIn.length === keysForFile.size ? "every locale" : missingIn.join(", ")})`,
          ]);
      }
    }
  });
}

if (!findings.length) {
  process.stdout.write(`rtl-audit: no candidates in ${files.length} file(s).${EOL}`);
  process.exit(0);
}
for (const [where, kind, excerpt] of findings)
  process.stdout.write(`${where}  [${kind}]  ${excerpt}${EOL}`);
process.stdout.write(
  `${EOL}rtl-audit: ${findings.length} candidate(s) in ${files.length} file(s). Confirm each before fixing.${EOL}`
);
process.exit(1);

function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function defaultBranch() {
  const ref = run("git symbolic-ref --quiet --short refs/remotes/origin/HEAD").trim();
  if (ref) return ref;
  if (run("git rev-parse --verify --quiet main").trim()) return "main";
  if (run("git rev-parse --verify --quiet master").trim()) return "master";
  return "HEAD";
}

function walk(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];
  const out = [];
  for (const name of readdirSync(path)) {
    if (SKIP_DIRS.has(name)) continue;
    out.push(...walk(join(path, name)));
  }
  return out;
}

/** Only count a class token inside a className/class attribute or a class-list helper call. */
function looksLikeClassList(line, index) {
  const before = line.slice(0, index);
  return (
    /(?:className|class)\s*=\s*(?:\{?["'`]|\{\s*(?:cn|clsx|cva|tv|twMerge)\()[^]*$/.test(before) ||
    /\b(?:cn|clsx|cva|tv|twMerge)\([^]*["'`][^"'`]*$/.test(before)
  );
}

/** Every `messages/` folder with locale JSON files, keyed by its parent folder (the app). */
function findMessageDirs() {
  const map = new Map();
  for (const dir of walkDirs(process.cwd(), 5)) {
    if (!/(^|[\\/])messages$/.test(dir)) continue;
    const locales = new Map();
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      try {
        locales.set(name, JSON.parse(readFileSync(join(dir, name), "utf8")));
      } catch {
        /* a malformed file is reported by the app's own tooling */
      }
    }
    if (locales.size > 1) map.set(resolve(dirname(dir)), locales);
  }
  return map;
}

/** The locale files of the app that owns `file`: the nearest ancestor that has a messages folder. */
function messagesFor(file) {
  let dir = dirname(file);
  while (dir && dir !== dirname(dir)) {
    if (messageDirs.has(dir)) return messageDirs.get(dir);
    dir = dirname(dir);
  }
  return null;
}

function walkDirs(path, depth) {
  if (depth < 0) return [];
  const out = [];
  let entries = [];
  try {
    entries = readdirSync(path);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(path, name);
    try {
      if (statSync(full).isDirectory()) out.push(full, ...walkDirs(full, depth - 1));
    } catch {
      /* unreadable entry */
    }
  }
  return out;
}

/**
 * True when `dotted` resolves in the messages object directly or under a namespace, because
 * `useTranslations("pages")` makes `t("title")` mean `pages.title`. Namespaces are searched up
 * to three levels deep.
 */
function hasKey(obj, dotted, depth = 3) {
  const direct = dotted
    .split(".")
    .reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
  if (direct !== undefined) return true;
  if (depth === 0 || !obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => v && typeof v === "object" && hasKey(v, dotted, depth - 1));
}
