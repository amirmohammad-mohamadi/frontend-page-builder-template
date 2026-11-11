/**
 * A dependency-free mock backend so both apps run on a fresh clone.
 *
 * It speaks the conventions the default backend adapter understands: a
 * `data` wrapper, `meta` pagination, `{ message, errors: { field: [] } }`
 * errors, Bearer tokens that are unsigned JWT look-alikes. Nothing here is
 * meant for production; replace it by pointing the env at a real API.
 *
 *   npm run mock-api            → http://localhost:4000
 *   MOCK_API_PORT=5000 node tools/mock-api/server.mjs
 *
 * Builder pages and media records persist to `tools/mock-api/data/*.json`
 * (gitignored) after every change and are loaded again on start; without
 * them the committed `seed/pages.json` is loaded. Uploaded files land in
 * `tools/mock-api/uploads/` (gitignored) and are served under `/uploads/`.
 *
 * Environment:
 *   MOCK_API_PORT        port (0 = random; the bound port is printed)
 *   MOCK_API_DELAY_MS    artificial latency per request (default 120)
 *   MOCK_API_STATE_DIR   where `data/` and `uploads/` live (default: this folder)
 *   MOCK_API_PUBLIC_URL  origin used in upload URLs (default: http://localhost:<port>)
 */
import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";

const PORT = Number(process.env.MOCK_API_PORT ?? 4000);
const DELAY_MS = Number(process.env.MOCK_API_DELAY_MS ?? 120);
const STATE_DIR = process.env.MOCK_API_STATE_DIR || import.meta.dirname;
const DATA_DIR = join(STATE_DIR, "data");
const UPLOADS_DIR = join(STATE_DIR, "uploads");
const SEED_DIR = join(import.meta.dirname, "seed");
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;
let publicOrigin = process.env.MOCK_API_PUBLIC_URL || `http://localhost:${PORT}`;

const users = {
  "user@example.com": {
    id: 1,
    name: "Sample User",
    email: "user@example.com",
    password: "password",
    roles: ["customer"],
    permissions: [],
    scope: "web",
  },
  "admin@example.com": {
    id: 100,
    name: "Sample Admin",
    email: "admin@example.com",
    password: "password",
    roles: ["admin"],
    permissions: [
      "examples.view",
      "examples.manage",
      "pages.view",
      "pages.manage",
      "media.view",
      "media.manage",
      "settings.manage",
    ],
    scope: "admin",
  },
};

let nextExampleId = 1;
const examples = new Map();
const seed = [
  "Getting started",
  "Second entry",
  "Archived note",
  "Active item",
  "Draft idea",
  "Another one",
  "Yet another",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
];
for (const [i, title] of seed.entries()) {
  const id = nextExampleId++;
  examples.set(id, {
    id,
    title,
    description: `Description of ${title.toLowerCase()}.`,
    status: ["draft", "active", "archived"][i % 3],
    created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
    updated_at: new Date(Date.now() - i * 86_400_000).toISOString(),
  });
}

// ── persistence (pages, media) ───────────────────────────────────────────────
/** Items of `data/<name>.json` when present, else of `seed/<name>.json`, else none. */
function loadCollection(name) {
  const stored = join(DATA_DIR, `${name}.json`);
  const seeded = join(SEED_DIR, `${name}.json`);
  const file = existsSync(stored) ? stored : existsSync(seeded) ? seeded : null;
  if (!file) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}
function persist(name, map) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    join(DATA_DIR, `${name}.json`),
    JSON.stringify({ items: [...map.values()] }, null, 2) + "\n"
  );
}

const pages = new Map();
for (const page of loadCollection("pages")) pages.set(Number(page.id), page);
let nextPageId = Math.max(0, ...pages.keys()) + 1;

const media = new Map();
for (const asset of loadCollection("media")) media.set(Number(asset.id), asset);
let nextMediaId = Math.max(0, ...media.keys()) + 1;

// ── tokens ───────────────────────────────────────────────────────────────────
const issued = new Set();
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
function mintToken(user, kind, ttl) {
  const payload = {
    sub: user.email,
    kind,
    exp: Math.floor(Date.now() / 1000) + ttl,
    jti: Math.random().toString(36).slice(2),
  };
  const token = `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.mock`;
  issued.add(token);
  return token;
}
function readToken(token, kind) {
  if (!token || !issued.has(token)) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    if (payload.kind !== kind || payload.exp * 1000 <= Date.now()) return null;
    return users[payload.sub] ?? null;
  } catch {
    return null;
  }
}
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: user.roles,
  permissions: user.permissions,
  avatar_url: null,
  created_at: null,
  updated_at: null,
});
const session = (user) => ({
  access_token: mintToken(user, "access", ACCESS_TTL_SECONDS),
  refresh_token: mintToken(user, "refresh", REFRESH_TTL_SECONDS),
  expires_in: ACCESS_TTL_SECONDS,
  user: publicUser(user),
});

// ── helpers ──────────────────────────────────────────────────────────────────
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
};
const error = (res, status, message, errors) =>
  json(res, status, { message, ...(errors ? { errors } : {}) });
const readJson = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(null);
      }
    });
  });
/** The whole request body as a Buffer, or `null` once it exceeds `cap` bytes. */
const readRaw = (req, cap) =>
  new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > cap) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(tooLarge ? null : Buffer.concat(chunks)));
    req.on("error", () => resolve(null));
  });
const bearer = (req) => (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || null;
const delay = () => new Promise((r) => setTimeout(r, DELAY_MS));
/** Answers 401/403 and returns `null` unless the request carries an admin access token. */
function requireAdmin(req, res) {
  const user = readToken(bearer(req), "access");
  if (!user) {
    error(res, 401, "Unauthenticated");
    return null;
  }
  if (user.scope !== "admin") {
    error(res, 403, "Forbidden");
    return null;
  }
  return user;
}
/** A `{ data, meta }` page of `items` from the `page` / `per_page` query parameters. */
function paginated(res, url, items) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page") ?? 20)));
  const total = items.length;
  return json(res, 200, {
    data: items.slice((page - 1) * perPage, page * perPage),
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      per_page: perPage,
      total,
    },
  });
}

// ── auth (shared by both scopes) ─────────────────────────────────────────────
async function handleAuth(req, res, url, scope, action) {
  const body = await readJson(req);
  if (action === "login") {
    if (!body) return error(res, 400, "Invalid JSON body");
    const user = users[String(body.email ?? "").toLowerCase()];
    const errors = {};
    if (!body.email) errors.email = ["The email field is required."];
    if (!body.password) errors.password = ["The password field is required."];
    if (Object.keys(errors).length) return error(res, 422, "The given data was invalid.", errors);
    if (!user || user.password !== body.password || user.scope !== scope)
      return error(res, 401, "These credentials do not match our records.");
    return json(res, 200, { data: session(user) });
  }
  if (action === "refresh") {
    const user = readToken(body?.refresh_token, "refresh");
    if (!user || user.scope !== scope) return error(res, 401, "Invalid refresh token");
    issued.delete(body.refresh_token);
    return json(res, 200, { data: session(user) });
  }
  if (action === "logout") {
    const token = bearer(req);
    if (token) issued.delete(token);
    return json(res, 200, { data: { success: true } });
  }
  if (action === "register" && scope === "web") {
    if (!body) return error(res, 400, "Invalid JSON body");
    const email = String(body.email ?? "").toLowerCase();
    if (users[email])
      return error(res, 422, "The given data was invalid.", {
        email: ["This email is already registered."],
      });
    const user = {
      id: Object.keys(users).length + 1,
      name: body.name ?? "",
      email,
      password: body.password,
      roles: ["customer"],
      permissions: [],
      scope: "web",
    };
    users[email] = user;
    return json(res, 201, { data: session(user) });
  }
  if (action === "forgot-password") return json(res, 200, { data: { success: true } });
  if (action === "reset-password") {
    const user = users[String(body?.email ?? "").toLowerCase()];
    if (!user || body?.token !== "mock-reset-token")
      return error(res, 422, "The given data was invalid.", {
        token: ["This reset token is invalid."],
      });
    user.password = body.password;
    return json(res, 200, { data: session(user) });
  }
  return error(res, 404, "Not found");
}

// ── examples ─────────────────────────────────────────────────────────────────
function listExamples(res, url) {
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  const status = url.searchParams.get("status");
  let items = [...examples.values()].sort((a, b) => b.id - a.id);
  if (search)
    items = items.filter(
      (e) =>
        e.title.toLowerCase().includes(search) ||
        (e.description ?? "").toLowerCase().includes(search)
    );
  if (status) items = items.filter((e) => e.status === status);
  return paginated(res, url, items);
}

function validateExample(body, partial) {
  const errors = {};
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length < 2)
      errors.title = ["The title must be at least 2 characters."];
  }
  if (body.status !== undefined && !["draft", "active", "archived"].includes(body.status))
    errors.status = ["The selected status is invalid."];
  return Object.keys(errors).length ? errors : null;
}

async function handleExamples(req, res, url, id) {
  const needsAuth = req.method !== "GET";
  if (needsAuth && !readToken(bearer(req), "access")) return error(res, 401, "Unauthenticated");
  if (id === undefined) {
    if (req.method === "GET") return listExamples(res, url);
    if (req.method === "POST") {
      const body = await readJson(req);
      if (!body) return error(res, 400, "Invalid JSON body");
      const errors = validateExample(body, false);
      if (errors) return error(res, 422, "The given data was invalid.", errors);
      const now = new Date().toISOString();
      const created = {
        id: nextExampleId++,
        title: body.title.trim(),
        description: body.description ?? null,
        status: body.status ?? "draft",
        created_at: now,
        updated_at: now,
      };
      examples.set(created.id, created);
      return json(res, 201, { data: created });
    }
    return error(res, 405, "Method not allowed");
  }
  const existing = examples.get(Number(id));
  if (!existing) return error(res, 404, "Example not found");
  if (req.method === "GET") return json(res, 200, { data: existing });
  if (req.method === "PATCH" || req.method === "PUT") {
    const body = await readJson(req);
    if (!body) return error(res, 400, "Invalid JSON body");
    const errors = validateExample(body, true);
    if (errors) return error(res, 422, "The given data was invalid.", errors);
    Object.assign(existing, body, {
      title: (body.title ?? existing.title).trim(),
      updated_at: new Date().toISOString(),
    });
    return json(res, 200, { data: existing });
  }
  if (req.method === "DELETE") {
    examples.delete(existing.id);
    return json(res, 204);
  }
  return error(res, 405, "Method not allowed");
}

// ── pages ────────────────────────────────────────────────────────────────────
const SLUG_PATTERN = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isLocalized = (value) =>
  isRecord(value) && Object.values(value).every((text) => typeof text === "string");
const hasText = (value) => Object.values(value).some((text) => text.trim().length > 0);
const isContent = (value) =>
  isRecord(value) &&
  Array.isArray(value.components) &&
  Array.isArray(value.styles) &&
  (value.css === undefined || typeof value.css === "string");
const emptyContent = () => ({ components: [], styles: [] });

function validatePage(body, partial, currentId) {
  const errors = {};
  if (!partial || body.slug !== undefined) {
    if (typeof body.slug !== "string" || !SLUG_PATTERN.test(body.slug))
      errors.slug = ["Use lowercase letters, digits, dashes and slashes."];
    else if ([...pages.values()].some((p) => p.slug === body.slug && p.id !== currentId))
      errors.slug = ["This slug is already taken."];
  }
  if (!partial || body.title !== undefined) {
    if (!isLocalized(body.title) || !hasText(body.title))
      errors.title = ["A title in at least one language is required."];
  }
  if (body.seo !== undefined && body.seo !== null) {
    if (!isRecord(body.seo)) errors.seo = ["The SEO settings must be an object."];
    else {
      if (body.seo.description !== undefined && !isLocalized(body.seo.description))
        errors["seo.description"] = ["The description must be a text per locale."];
      if (
        body.seo.image !== undefined &&
        body.seo.image !== null &&
        typeof body.seo.image !== "string"
      )
        errors["seo.image"] = ["The image must be a URL or null."];
    }
  }
  if (body.draft !== undefined && !isContent(body.draft))
    errors.draft = [
      "The draft needs `components` and `styles` arrays and an optional `css` string.",
    ];
  return Object.keys(errors).length ? errors : null;
}

/** The public answer never carries unpublished work: `draft` mirrors `published`. */
const publicPage = (page) => ({ ...page, draft: page.published });

function listPages(res, url) {
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  const status = url.searchParams.get("status");
  let items = [...pages.values()].sort((a, b) => b.id - a.id);
  if (search)
    items = items.filter(
      (p) =>
        p.slug.includes(search) ||
        Object.values(p.title).some((t) => t.toLowerCase().includes(search))
    );
  if (status) items = items.filter((p) => p.status === status);
  return paginated(res, url, items);
}

async function handleAdminPages(req, res, url, id, action) {
  if (!requireAdmin(req, res)) return;
  if (id === undefined) {
    if (req.method === "GET") return listPages(res, url);
    if (req.method === "POST") {
      const body = await readJson(req);
      if (!body) return error(res, 400, "Invalid JSON body");
      const errors = validatePage(body, false);
      if (errors) return error(res, 422, "The given data was invalid.", errors);
      const now = new Date().toISOString();
      const created = {
        id: nextPageId++,
        slug: body.slug,
        status: "draft",
        title: body.title,
        seo: body.seo ?? null,
        draft: body.draft ?? emptyContent(),
        published: null,
        published_at: null,
        created_at: now,
        updated_at: now,
      };
      pages.set(created.id, created);
      persist("pages", pages);
      return json(res, 201, { data: created });
    }
    return error(res, 405, "Method not allowed");
  }
  const existing = pages.get(Number(id));
  if (!existing) return error(res, 404, "Page not found");
  if (action === "publish" || action === "unpublish") {
    if (req.method !== "POST") return error(res, 405, "Method not allowed");
    const now = new Date().toISOString();
    if (action === "publish") {
      existing.published = structuredClone(existing.draft);
      existing.published_at = now;
      existing.status = "published";
    } else {
      existing.published = null;
      existing.published_at = null;
      existing.status = "draft";
    }
    existing.updated_at = now;
    persist("pages", pages);
    return json(res, 200, { data: existing });
  }
  if (req.method === "GET") return json(res, 200, { data: existing });
  if (req.method === "PATCH" || req.method === "PUT") {
    const body = await readJson(req);
    if (!body) return error(res, 400, "Invalid JSON body");
    const errors = validatePage(body, true, existing.id);
    if (errors) return error(res, 422, "The given data was invalid.", errors);
    if (body.slug !== undefined) existing.slug = body.slug;
    if (body.title !== undefined) existing.title = body.title;
    if (body.seo !== undefined) existing.seo = body.seo;
    if (body.draft !== undefined) existing.draft = body.draft;
    existing.updated_at = new Date().toISOString();
    persist("pages", pages);
    return json(res, 200, { data: existing });
  }
  if (req.method === "DELETE") {
    pages.delete(existing.id);
    persist("pages", pages);
    return json(res, 204);
  }
  return error(res, 405, "Method not allowed");
}

/** `GET /api/v1/pages/<slug>` (public, published only) and `GET /api/v1/pages/<slug>/preview` (signed in, draft). */
function handlePublicPage(req, res, rawSlug, preview) {
  if (req.method !== "GET") return error(res, 405, "Method not allowed");
  let slug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    return error(res, 404, "Page not found");
  }
  const page = [...pages.values()].find((p) => p.slug === slug);
  if (preview) {
    if (!readToken(bearer(req), "access")) return error(res, 401, "Unauthenticated");
    if (!page) return error(res, 404, "Page not found");
    return json(res, 200, { data: page });
  }
  if (!page || !page.published) return error(res, 404, "Page not found");
  return json(res, 200, { data: publicPage(page) });
}

// ── media ────────────────────────────────────────────────────────────────────
const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};
const EXT_BY_MIME = Object.fromEntries(
  Object.entries(MIME_BY_EXT).map(([ext, mime]) => [mime, ext])
);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Width and height from the header bytes of a PNG, GIF or JPEG; `null`s for anything else. */
function imageSize(bytes, mime) {
  try {
    if (mime === "image/png" && bytes.length >= 24 && bytes.subarray(0, 8).equals(PNG_SIGNATURE))
      return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    if (mime === "image/gif" && bytes.length >= 10 && bytes.subarray(0, 3).toString() === "GIF")
      return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
    if (mime === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = bytes[offset + 1];
        if (marker === 0xff) {
          offset += 1;
          continue;
        }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
          offset += 2;
          continue;
        }
        const isStartOfFrame =
          marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
        if (isStartOfFrame)
          return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
        if (marker === 0xda) break;
        offset += 2 + bytes.readUInt16BE(offset + 2);
      }
    }
  } catch {
    // A truncated header is not an error; the size is simply unknown.
  }
  return { width: null, height: null };
}

/**
 * Splits a `multipart/form-data` body into its parts without a dependency:
 * `{ name, filename?, type?, data }` per part. Good enough for the uploads
 * the admin app sends; not a general-purpose parser.
 */
function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = buffer.indexOf(delimiter);
  while (cursor !== -1) {
    cursor += delimiter.length;
    if (buffer.subarray(cursor, cursor + 2).toString() === "--") break;
    cursor += 2; // CRLF after the delimiter
    const headerEnd = buffer.indexOf("\r\n\r\n", cursor);
    if (headerEnd === -1) break;
    const headers = {};
    for (const line of buffer.subarray(cursor, headerEnd).toString("utf8").split("\r\n")) {
      const colon = line.indexOf(":");
      if (colon > 0)
        headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
    }
    const bodyStart = headerEnd + 4;
    const next = buffer.indexOf(delimiter, bodyStart);
    if (next === -1) break;
    const disposition = headers["content-disposition"] ?? "";
    parts.push({
      name: /\bname="([^"]*)"/.exec(disposition)?.[1] ?? "",
      filename: /\bfilename="([^"]*)"/.exec(disposition)?.[1],
      type: headers["content-type"],
      data: buffer.subarray(bodyStart, Math.max(bodyStart, next - 2)),
    });
    cursor = next;
  }
  return parts;
}

/** A file name safe for the uploads folder: the base name, ASCII only, with an extension that matches the mime. */
function safeFileName(original, mime) {
  const base =
    String(original || "file")
      .split(/[\\/]/)
      .pop()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 80) || "file";
  return extname(base) ? base : `${base}${EXT_BY_MIME[mime] ?? ""}`;
}

/** The record as the API answers it: the stored file name becomes a URL. */
const publicMedia = ({ file, ...asset }) => ({
  ...asset,
  url: `${publicOrigin}/uploads/${encodeURIComponent(file)}`,
});

function listMedia(res, url) {
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  let items = [...media.values()].sort((a, b) => b.id - a.id);
  if (search) items = items.filter((m) => m.name.toLowerCase().includes(search));
  return paginated(res, url, items.map(publicMedia));
}

async function uploadMedia(req, res) {
  const contentType = req.headers["content-type"] ?? "";
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!contentType.startsWith("multipart/form-data") || !boundary)
    return error(res, 415, "Send multipart/form-data with the file under the `file` field");
  const raw = await readRaw(req, MAX_UPLOAD_BYTES);
  if (raw === null) return error(res, 413, "The file is too large");
  const parts = parseMultipart(raw, boundary[1] ?? boundary[2]);
  const file = parts.find((p) => p.name === "file" && p.filename !== undefined);
  if (!file || file.data.length === 0)
    return error(res, 422, "The given data was invalid.", { file: ["A file is required."] });
  const requestedName = parts
    .find((p) => p.name === "name" && p.filename === undefined)
    ?.data.toString("utf8")
    .trim();
  const declared = (file.type ?? "").split(";")[0].trim().toLowerCase();
  const mime =
    declared && declared !== "application/octet-stream"
      ? declared
      : (MIME_BY_EXT[extname(file.filename).toLowerCase()] ?? "application/octet-stream");
  const id = nextMediaId++;
  const stored = `${id}-${safeFileName(file.filename, mime)}`;
  mkdirSync(UPLOADS_DIR, { recursive: true });
  writeFileSync(join(UPLOADS_DIR, stored), file.data);
  const now = new Date().toISOString();
  const asset = {
    id,
    file: stored,
    name: requestedName || file.filename || stored,
    mime,
    size: file.data.length,
    ...imageSize(file.data, mime),
    alt: {},
    created_at: now,
    updated_at: now,
  };
  media.set(id, asset);
  persist("media", media);
  return json(res, 201, { data: publicMedia(asset) });
}

function validateMedia(body) {
  const errors = {};
  if (body.alt !== undefined && !isLocalized(body.alt))
    errors.alt = ["The alt text must be a text per locale."];
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim()))
    errors.name = ["The name is required."];
  return Object.keys(errors).length ? errors : null;
}

async function handleAdminMedia(req, res, url, id) {
  if (!requireAdmin(req, res)) return;
  if (id === undefined) {
    if (req.method === "GET") return listMedia(res, url);
    if (req.method === "POST") return uploadMedia(req, res);
    return error(res, 405, "Method not allowed");
  }
  const existing = media.get(Number(id));
  if (!existing) return error(res, 404, "Media not found");
  if (req.method === "GET") return json(res, 200, { data: publicMedia(existing) });
  if (req.method === "PATCH" || req.method === "PUT") {
    const body = await readJson(req);
    if (!body) return error(res, 400, "Invalid JSON body");
    const errors = validateMedia(body);
    if (errors) return error(res, 422, "The given data was invalid.", errors);
    if (body.alt !== undefined) existing.alt = body.alt;
    if (body.name !== undefined) existing.name = body.name.trim();
    existing.updated_at = new Date().toISOString();
    persist("media", media);
    return json(res, 200, { data: publicMedia(existing) });
  }
  if (req.method === "DELETE") {
    media.delete(existing.id);
    persist("media", media);
    try {
      unlinkSync(join(UPLOADS_DIR, existing.file));
    } catch {
      // Already gone; the record is what matters.
    }
    return json(res, 204);
  }
  return error(res, 405, "Method not allowed");
}

/** `GET /uploads/<file>`: streams a stored upload with its content type. */
function serveUpload(req, res, rawName) {
  if (req.method !== "GET" && req.method !== "HEAD") return error(res, 405, "Method not allowed");
  let name;
  try {
    name = decodeURIComponent(rawName);
  } catch {
    return error(res, 404, "File not found");
  }
  if (!name || /[\\/]/.test(name) || name.includes("..")) return error(res, 404, "File not found");
  const file = join(UPLOADS_DIR, name);
  if (!existsSync(file)) return error(res, 404, "File not found");
  res.writeHead(200, {
    "Content-Type": MIME_BY_EXT[extname(name).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": statSync(file).size,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

// ── router ───────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, Accept-Language, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return json(res, 204);
  if (DELAY_MS > 0) await delay();

  const url = new URL(req.url, publicOrigin);
  const path = url.pathname.replace(/\/$/, "");
  let match;

  if (path === "/health") return json(res, 200, { ok: true });
  if ((match = path.match(/^\/api\/v1\/(admin\/)?auth\/([a-z-]+)$/))) {
    return handleAuth(req, res, url, match[1] ? "admin" : "web", match[2]);
  }
  if ((match = path.match(/^\/api\/v1\/(admin\/)?me$/))) {
    const user = readToken(bearer(req), "access");
    if (!user || user.scope !== (match[1] ? "admin" : "web"))
      return error(res, 401, "Unauthenticated");
    return json(res, 200, { data: publicUser(user) });
  }
  if ((match = path.match(/^\/api\/v1\/examples(?:\/(\d+))?$/)))
    return handleExamples(req, res, url, match[1]);
  if ((match = path.match(/^\/api\/v1\/admin\/pages(?:\/(\d+)(?:\/(publish|unpublish))?)?$/)))
    return handleAdminPages(req, res, url, match[1], match[2]);
  if ((match = path.match(/^\/api\/v1\/admin\/media(?:\/(\d+))?$/)))
    return handleAdminMedia(req, res, url, match[1]);
  // A slug may contain `/`, so the slug is the rest of the path; a trailing `/preview` selects the draft.
  if ((match = path.match(/^\/api\/v1\/pages\/(.+?)(\/preview)?$/)))
    return handlePublicPage(req, res, match[1], Boolean(match[2]));
  if ((match = path.match(/^\/uploads\/([^/]+)$/))) return serveUpload(req, res, match[1]);
  return error(res, 404, `No mock route for ${req.method} ${path}`);
});

server.listen(PORT, () => {
  const { port } = server.address();
  if (!process.env.MOCK_API_PUBLIC_URL) publicOrigin = `http://localhost:${port}`;
  console.log(`mock api listening on ${publicOrigin}`);
  console.log("accounts: user@example.com / password (web), admin@example.com / password (admin)");
  console.log(`pages: ${pages.size}, media: ${media.size}, state in ${STATE_DIR}`);
});
