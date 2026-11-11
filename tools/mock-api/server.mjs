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
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 4000);
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

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
    permissions: ["examples.view", "examples.manage", "settings.manage"],
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
const bearer = (req) => (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || null;
const delay = () => new Promise((r) => setTimeout(r, 120));

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
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page") ?? 20)));
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
  const total = items.length;
  const data = items.slice((page - 1) * perPage, page * perPage);
  return json(res, 200, {
    data,
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      per_page: perPage,
      total,
    },
  });
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
  await delay();

  const url = new URL(req.url, `http://localhost:${PORT}`);
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
  return error(res, 404, `No mock route for ${req.method} ${path}`);
});

server.listen(PORT, () => {
  console.log(`mock api listening on http://localhost:${PORT}`);
  console.log("accounts: user@example.com / password (web), admin@example.com / password (admin)");
});
