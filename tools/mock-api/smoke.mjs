/**
 * Smoke test of the mock API's page and media routes. Starts `server.mjs` on
 * a random port with its state in a temporary folder, walks one operator
 * journey (sign in → create a page → preview → publish → public read →
 * unpublish → upload → list → delete) and exits non-zero on the first
 * failed expectation. Nothing under `tools/mock-api/data` is touched.
 *
 *   npm run mock-api:smoke
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const stateDir = mkdtempSync(join(tmpdir(), "mock-api-smoke-"));
const child = spawn(process.execPath, [join(import.meta.dirname, "server.mjs")], {
  env: {
    ...process.env,
    MOCK_API_PORT: "0",
    MOCK_API_DELAY_MS: "0",
    MOCK_API_STATE_DIR: stateDir,
    MOCK_API_PUBLIC_URL: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stderr.on("data", (chunk) => process.stderr.write(chunk));

const origin = await new Promise((resolve, reject) => {
  let out = "";
  const timer = setTimeout(() => reject(new Error("the mock api did not start in time")), 10_000);
  child.stdout.on("data", (chunk) => {
    out += chunk;
    const match = /listening on (http:\/\/localhost:\d+)/.exec(out);
    if (match) {
      clearTimeout(timer);
      resolve(match[1]);
    }
  });
  child.on("exit", (code) => reject(new Error(`the mock api exited early with code ${code}`)));
});

let failures = 0;
let step = "";
function check(condition, detail) {
  if (condition) return;
  failures += 1;
  console.error(`  FAIL ${step}: ${detail}`);
}
async function call(method, path, { token, body, form } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${origin}${path}`, {
    method,
    headers,
    body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, headers: response.headers };
}

try {
  step = "health";
  check((await call("GET", "/health")).status === 200, "GET /health is not 200");

  step = "login";
  const login = await call("POST", "/api/v1/admin/auth/login", {
    body: { email: "admin@example.com", password: "password" },
  });
  check(login.status === 200, `admin login answered ${login.status}`);
  const token = login.json?.data?.access_token;
  check(typeof token === "string", "no access token in the login answer");
  const webLogin = await call("POST", "/api/v1/auth/login", {
    body: { email: "user@example.com", password: "password" },
  });
  const webToken = webLogin.json?.data?.access_token;

  step = "admin routes refuse anonymous and non-admin callers";
  check((await call("GET", "/api/v1/admin/pages")).status === 401, "anonymous list is not 401");
  check(
    (await call("GET", "/api/v1/admin/pages", { token: webToken })).status === 403,
    "web user list is not 403"
  );

  step = "seed";
  const seeded = await call("GET", "/api/v1/admin/pages", { token });
  check(seeded.status === 200, `list answered ${seeded.status}`);
  check(
    seeded.json?.data?.some((p) => p.slug === "about" && p.status === "published"),
    "the seeded `about` page is missing"
  );
  const publicAbout = await call("GET", "/api/v1/pages/about");
  check(publicAbout.status === 200, `public seeded page answered ${publicAbout.status}`);

  step = "create page";
  const invalid = await call("POST", "/api/v1/admin/pages", {
    token,
    body: { slug: "Bad Slug", title: {} },
  });
  check(invalid.status === 422, `invalid create answered ${invalid.status}`);
  check(invalid.json?.errors?.slug && invalid.json?.errors?.title, "422 lacks field errors");
  const created = await call("POST", "/api/v1/admin/pages", {
    token,
    body: { slug: "smoke/hello", title: { en: "Hello", fa: "سلام" } },
  });
  check(created.status === 201, `create answered ${created.status}`);
  const page = created.json?.data;
  check(page?.status === "draft" && page?.published === null, "a new page is not a draft");
  check(Array.isArray(page?.draft?.components), "a new page has no draft content");
  const duplicate = await call("POST", "/api/v1/admin/pages", {
    token,
    body: { slug: "smoke/hello", title: { en: "Again" } },
  });
  check(duplicate.status === 422, "a duplicate slug is not refused");

  step = "public read of a draft";
  check(
    (await call("GET", "/api/v1/pages/smoke/hello")).status === 404,
    "an unpublished page is public"
  );

  step = "preview";
  check(
    (await call("GET", "/api/v1/pages/smoke/hello/preview")).status === 401,
    "anonymous preview is not 401"
  );
  const preview = await call("GET", "/api/v1/pages/smoke/hello/preview", { token });
  check(preview.status === 200, `preview answered ${preview.status}`);
  check(preview.json?.data?.slug === "smoke/hello", "preview returned another page");

  step = "save draft";
  const draft = {
    components: [{ type: "section", components: [{ type: "heading", attributes: { text: "x" } }] }],
    styles: [],
    css: "",
  };
  const saved = await call("PATCH", `/api/v1/admin/pages/${page.id}`, {
    token,
    body: { draft, seo: { description: { en: "Hi" }, image: null } },
  });
  check(saved.status === 200, `save answered ${saved.status}`);
  check(saved.json?.data?.draft?.components?.length === 1, "the draft was not saved");
  check(saved.json?.data?.published === null, "saving a draft published it");

  step = "publish";
  const published = await call("POST", `/api/v1/admin/pages/${page.id}/publish`, { token });
  check(published.status === 200, `publish answered ${published.status}`);
  check(published.json?.data?.status === "published", "status is not published");
  check(typeof published.json?.data?.published_at === "string", "published_at is not set");
  check(
    JSON.stringify(published.json?.data?.published) === JSON.stringify(draft),
    "published is not a copy of the draft"
  );
  const publicPage = await call("GET", "/api/v1/pages/smoke/hello");
  check(publicPage.status === 200, `public read answered ${publicPage.status}`);
  check(
    JSON.stringify(publicPage.json?.data?.draft) === JSON.stringify(draft),
    "the public answer does not mirror the published content"
  );

  step = "unpublish";
  const unpublished = await call("POST", `/api/v1/admin/pages/${page.id}/unpublish`, { token });
  check(unpublished.json?.data?.status === "draft", "status is not draft after unpublish");
  check(unpublished.json?.data?.published === null, "published is not cleared");
  check(
    (await call("GET", "/api/v1/pages/smoke/hello")).status === 404,
    "an unpublished page is still public"
  );

  step = "upload";
  const form = new FormData();
  form.append("file", new Blob([ONE_BY_ONE_PNG], { type: "image/png" }), "dot.png");
  form.append("name", "One pixel");
  const uploaded = await call("POST", "/api/v1/admin/media", { token, form });
  check(uploaded.status === 201, `upload answered ${uploaded.status}`);
  const asset = uploaded.json?.data;
  check(asset?.mime === "image/png", `mime is ${asset?.mime}`);
  check(asset?.size === ONE_BY_ONE_PNG.length, `size is ${asset?.size}`);
  check(asset?.width === 1 && asset?.height === 1, `size read as ${asset?.width}x${asset?.height}`);
  check(asset?.name === "One pixel", `name is ${asset?.name}`);
  check(
    typeof asset?.url === "string" && asset.url.startsWith(`${origin}/uploads/`),
    `url is ${asset?.url}`
  );
  check(asset?.file === undefined, "the stored file name leaks into the answer");
  const served = await fetch(asset.url);
  check(served.status === 200, `serving the upload answered ${served.status}`);
  check(
    served.headers.get("content-type") === "image/png",
    `served content type is ${served.headers.get("content-type")}`
  );
  check(
    Buffer.from(await served.arrayBuffer()).equals(ONE_BY_ONE_PNG),
    "the served bytes differ from the upload"
  );
  const noFile = await call("POST", "/api/v1/admin/media", { token, form: new FormData() });
  check(noFile.status === 422, `an upload without a file answered ${noFile.status}`);

  step = "list media";
  const list = await call("GET", "/api/v1/admin/media?search=pixel", { token });
  check(list.status === 200, `list answered ${list.status}`);
  check(list.json?.meta?.total === 1, `total is ${list.json?.meta?.total}`);
  check(list.json?.data?.[0]?.id === asset.id, "the uploaded asset is not listed");

  step = "update media";
  const altered = await call("PATCH", `/api/v1/admin/media/${asset.id}`, {
    token,
    body: { alt: { en: "A dot", fa: "یک نقطه" } },
  });
  check(altered.json?.data?.alt?.fa === "یک نقطه", "the alt text was not saved");

  step = "delete media";
  check(
    (await call("DELETE", `/api/v1/admin/media/${asset.id}`, { token })).status === 204,
    "delete is not 204"
  );
  check((await fetch(asset.url)).status === 404, "a deleted upload is still served");
  check(
    (await call("GET", `/api/v1/admin/media/${asset.id}`, { token })).status === 404,
    "a deleted asset is still readable"
  );

  step = "delete page";
  check(
    (await call("DELETE", `/api/v1/admin/pages/${page.id}`, { token })).status === 204,
    "delete is not 204"
  );
  check(
    (await call("GET", `/api/v1/admin/pages/${page.id}`, { token })).status === 404,
    "a deleted page is still readable"
  );

  step = "persistence";
  check(existsSync(join(stateDir, "data", "pages.json")), "pages.json was not written");
  check(existsSync(join(stateDir, "data", "media.json")), "media.json was not written");

  step = "existing routes";
  check((await call("GET", "/api/v1/examples")).status === 200, "GET /api/v1/examples broke");
  check(
    (await call("GET", "/api/v1/admin/me", { token })).status === 200,
    "GET /api/v1/admin/me broke"
  );
} catch (caught) {
  failures += 1;
  console.error(`  FAIL ${step}: ${caught instanceof Error ? caught.message : String(caught)}`);
} finally {
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
  rmSync(stateDir, { recursive: true, force: true });
}

if (failures) {
  console.error(`mock-api smoke: ${failures} failure(s)`);
  process.exit(1);
}
console.log("mock-api smoke: passed");
