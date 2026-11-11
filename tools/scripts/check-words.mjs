/**
 * Fails when tracked files contain text that must never ship in this
 * repository: hard-coded private hosts, leftover debugging, project-specific
 * names. Patterns come from `check-words.config.json` (committed) and from an
 * optional `--words a,b,c` argument or a `.check-words.local` file (one
 * pattern per line, not committed) for names a team wants to keep private.
 *
 *   node tools/scripts/check-words.mjs
 *   node tools/scripts/check-words.mjs --words "oldbrand,internal-host"
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const config = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "check-words.config.json"), "utf8")
);

const extraArg = process.argv.find((a, i, all) => all[i - 1] === "--words");
const localFile = resolve(root, ".check-words.local");
const extraWords = [
  ...(extraArg ? extraArg.split(",") : []),
  ...(existsSync(localFile) ? readFileSync(localFile, "utf8").split(/\r?\n/) : []),
]
  .map((w) => w.trim())
  .filter(Boolean);

const patterns = [
  ...config.patterns.map((p) => ({
    source: p.pattern,
    regex: new RegExp(p.pattern, "i"),
    reason: p.reason,
  })),
  ...extraWords.map((w) => ({
    source: w,
    regex: new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    reason: "forbidden word",
  })),
];

const ignore = new RegExp(config.ignorePaths.join("|"));
const files = execSync("git ls-files", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(
    (f) => f && !ignore.test(f) && !/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|lock)$/i.test(f)
  );

const findings = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(resolve(root, file), "utf8");
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  for (const { regex, reason, source } of patterns) {
    lines.forEach((line, index) => {
      if (regex.test(line))
        findings.push(
          `${file}:${index + 1}  [${reason}] /${source}/  ${line.trim().slice(0, 100)}`
        );
    });
  }
}

if (findings.length) {
  console.error(`check:words found ${findings.length} problem(s):\n`);
  for (const f of findings) console.error("  " + f);
  process.exit(1);
}
console.log(`check:words passed (${files.length} files, ${patterns.length} patterns).`);
