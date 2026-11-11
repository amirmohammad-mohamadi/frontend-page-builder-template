import { formatFiles, generateFiles, names, type Tree } from "@nx/devkit";
import { join } from "node:path";

type Schema = { name: string; plural?: string; endpoint?: string; adminPage?: boolean };

/** Appends a line to a barrel file once. */
function addExport(tree: Tree, file: string, line: string) {
  const current = tree.read(file, "utf8") ?? "";
  if (current.includes(line)) return;
  tree.write(file, `${current.trimEnd()}\n${line}\n`);
}

/** Inserts an endpoint group before the closing of the `endpoints` object. */
function addEndpoints(tree: Tree, key: string, listPath: string) {
  const file = "libs/services/src/lib/shared/endpoints.ts";
  const current = tree.read(file, "utf8") ?? "";
  if (current.includes(`\n  ${key}: {`)) return;
  const block = `  ${key}: {\n    list: "${listPath}",\n    byId: (id: number | string) => \`${listPath}/\${id}\`,\n  },\n} as const;`;
  tree.write(file, current.replace(/\n\} as const;/, `\n${block}`));
}

/** Adds the admin texts of a list page before the `common:` section of `apps/admin/src/texts.ts`. */
function addAdminTexts(tree: Tree, key: string, title: string) {
  const file = "apps/admin/src/texts.ts";
  const current = tree.read(file, "utf8") ?? "";
  if (current.includes(`\n  ${key}: {`)) return;
  const block = [
    `  ${key}: {`,
    `    title: "${title}",`,
    `    search: "Search ${title.toLowerCase()}",`,
    `    columns: { name: "Name", created: "Created" },`,
    `    empty: "Nothing here yet.",`,
    `    loadError: "The list could not be loaded.",`,
    `    previous: "Previous",`,
    `    next: "Next",`,
    `  },`,
    `  common: {`,
  ].join("\n");
  tree.write(file, current.replace(/\n {2}common: \{/, `\n${block}`));
}

/**
 * Scaffolds one domain through every layer the architecture defines:
 * DTO schemas, a model, the services folder (api, hooks, query keys), the
 * endpoint entry, barrel exports, and optionally an admin list page. The
 * output mirrors the `example` domain, so reading that one explains these.
 */
export default async function domainGenerator(tree: Tree, schema: Schema) {
  const n = names(schema.name);
  const plural = schema.plural ?? `${n.fileName}s`;
  const p = names(plural);
  const endpoint = schema.endpoint ?? `/api/v1/${p.fileName}`;
  const substitutions = {
    ...n,
    fileName: n.fileName,
    className: n.className,
    propertyName: n.propertyName,
    pluralFileName: p.fileName,
    pluralClassName: p.className,
    pluralPropertyName: p.propertyName,
    endpoint,
    tmpl: "",
  };

  generateFiles(tree, join(__dirname, "files", "libs"), ".", substitutions);
  if (schema.adminPage !== false) {
    generateFiles(tree, join(__dirname, "files", "admin"), ".", substitutions);
    addAdminTexts(tree, p.propertyName, p.className);
  }

  addExport(tree, "libs/dtos/src/index.ts", `export * from "./lib/${n.fileName}";`);
  addExport(tree, "libs/models/src/index.ts", `export * from "./lib/${n.fileName}";`);
  addExport(tree, "libs/services/src/index.ts", `export * from "./lib/${n.fileName}";`);
  addEndpoints(tree, n.propertyName, endpoint);

  await formatFiles(tree);

  return () => {
    console.log(`\nDomain "${n.fileName}" scaffolded. Next:`);
    console.log(
      `  - fill in the fields in libs/dtos/src/lib/${n.fileName}/${n.fileName}.dto.ts and the model`
    );
    if (schema.adminPage !== false)
      console.log(
        `  - add { title: "${p.className}", url: "/${p.fileName}" } to apps/admin/src/config/navigation.ts`
      );
    console.log("  - npm run typecheck");
  };
}
