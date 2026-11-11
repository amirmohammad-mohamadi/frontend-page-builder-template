/**
 * Deletes the `example` reference domain once a real domain exists, and
 * leaves the workspace green: folders and the example e2e spec are removed,
 * barrel exports and the endpoint entry are stripped, the blocks between
 * `example-domain:start` / `example-domain:end` markers are cut out of the
 * app files that mention the domain, the message namespaces and env
 * defaults are cleaned, then `nx sync` and the typecheck run.
 *
 *   npm run example:remove
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const abs = (p) => resolve(root, p);

const log = (verb, p) => console.log(`${verb.padEnd(8)} ${p}`);

function remove(p) {
  if (!existsSync(abs(p))) return;
  rmSync(abs(p), { recursive: true, force: true });
  log("removed", p);
}

function rewrite(p, transform) {
  if (!existsSync(abs(p))) return;
  const before = readFileSync(abs(p), "utf8");
  const after = transform(before);
  if (after !== before) {
    writeFileSync(abs(p), after);
    log("edited", p);
  }
}

/** Drops every line from a start marker to its end marker, markers included. */
function cutMarkedBlocks(text) {
  const lines = text.split(/\r?\n/);
  const kept = [];
  let cutting = false;
  for (const line of lines) {
    if (line.includes("example-domain:start")) {
      cutting = true;
      continue;
    }
    if (line.includes("example-domain:end")) {
      cutting = false;
      continue;
    }
    if (!cutting) kept.push(line);
  }
  return kept.join("\n");
}

/** Deletes dotted keys from a JSON file, keeping two-space formatting. */
function dropJsonKeys(text, keys) {
  const data = JSON.parse(text);
  for (const key of keys) {
    const path = key.split(".");
    let node = data;
    for (const part of path.slice(0, -1)) node = node?.[part];
    if (node && path.at(-1) in node) delete node[path.at(-1)];
  }
  return `${JSON.stringify(data, null, 2)}\n`;
}

// 1. Folders and files that exist only for the example domain.
for (const p of [
  "libs/dtos/src/lib/example",
  "libs/models/src/lib/example",
  "libs/services/src/lib/example",
  "apps/web/src/app/[locale]/examples",
  "apps/web/src/features/examples",
  "apps/admin/src/app/(dashboard)/examples",
  "apps/admin/src/features/examples",
  "e2e/examples.spec.ts",
]) {
  remove(p);
}

// 2. Barrel exports and the endpoint group.
for (const p of [
  "libs/dtos/src/index.ts",
  "libs/models/src/index.ts",
  "libs/services/src/index.ts",
]) {
  rewrite(p, (text) =>
    text
      .split(/\r?\n/)
      .filter((line) => !line.includes("/example"))
      .join("\n")
  );
}
rewrite("libs/services/src/lib/shared/endpoints.ts", (text) =>
  text.replace(/\n {2}example: \{[\s\S]*?\n {2}\},/, "")
);

// 3. Marked blocks in app files.
for (const p of [
  "apps/admin/src/features/overview/overview.tsx",
  "apps/admin/src/config/navigation.ts",
  "apps/admin/src/texts.ts",
  "apps/web/src/components/site-header.tsx",
  "apps/web/src/app/[locale]/page.tsx",
]) {
  rewrite(p, cutMarkedBlocks);
}

// 4. Message namespaces and env defaults.
for (const p of ["apps/web/messages/en.json", "apps/web/messages/fa.json"]) {
  rewrite(p, (text) => dropJsonKeys(text, ["examples", "nav.examples", "home.viewExamples"]));
}
for (const p of [".env.example", "apps/web/src/env.ts", "apps/admin/src/env.ts"]) {
  rewrite(p, (text) => text.replace(/,\/api\/v1\/examples\b/g, ""));
}

// 5. Project references follow the imports that are gone, then the gate.
const run = (command) => {
  console.log(`\n$ ${command}`);
  execSync(command, { cwd: root, stdio: "inherit" });
};
run("npx nx sync");
run("npm run typecheck");
run("npx prettier --write apps/web/messages/en.json apps/web/messages/fa.json");

console.log(
  "\nThe example domain is gone and the workspace typechecks. Run `npm run check` and `npm run e2e` before committing."
);
