import { NextRequest } from "next/server";
import { createAuthServer } from "./create-auth-server";

const jwt = (seconds: number) =>
  `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString("base64url")}.x`;

const user = { id: 1, name: "Sample", email: "s@example.com" };
const tokens = () => ({ access_token: jwt(900), refresh_token: jwt(86_400), user });

const answer = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const server = createAuthServer({
  cookiePrefix: "t",
  backend: {
    baseUrl: "http://backend.test",
    paths: { login: "/auth/login", logout: "/auth/logout", refresh: "/auth/refresh", me: "/me" },
  },
  proxyPrefixes: ["/api/v1/examples"],
  secureCookies: false,
  maxAuthBodyBytes: 256,
  maxProxyBodyBytes: 256,
});

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://app.test",
      host: "app.test",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const cookieHeader = (res: Response) => res.headers.getSetCookie().join("\n");

let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("login handler", () => {
  it("refuses a cross-origin call", async () => {
    const res = await server.handlers.login(
      post("http://app.test/api/auth/login", {}, { origin: "http://evil.test" })
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 422 with field errors for an invalid body", async () => {
    const res = await server.handlers.login(
      post("http://app.test/api/auth/login", { email: "nope", password: "short" })
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(Object.keys(body.errors)).toEqual(expect.arrayContaining(["email", "password"]));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a body over the cap before parsing", async () => {
    const res = await server.handlers.login(
      post("http://app.test/api/auth/login", { email: "a@b.co", password: "x".repeat(2000) })
    );
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("opens a persistent session from the backend's token pair and returns only the user", async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { data: tokens() }));
    const res = await server.handlers.login(
      post("http://app.test/api/auth/login", { email: "a@b.co", password: "password" })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { user } });
    const cookies = cookieHeader(res);
    expect(cookies).toMatch(/t_access=.*HttpOnly/);
    expect(cookies).toMatch(/t_refresh=.*Max-Age=/);
    expect(cookies).not.toContain("access_token");
    expect(res.headers.get("cache-control")).toBe("no-store, private");
  });

  it("writes session cookies without Max-Age when remember is false", async () => {
    fetchMock.mockResolvedValueOnce(answer(200, tokens()));
    const res = await server.handlers.login(
      post("http://app.test/api/auth/login", {
        email: "a@b.co",
        password: "password",
        remember: false,
      })
    );
    expect(cookieHeader(res)).not.toMatch(/Max-Age/);
  });

  it("passes a backend refusal through with its status and Retry-After", async () => {
    fetchMock.mockResolvedValueOnce(answer(429, { message: "Slow down" }, { "retry-after": "30" }));
    const res = await server.handlers.login(
      post("http://app.test/api/auth/login", { email: "a@b.co", password: "password" })
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("30");
  });
});

describe("me handler", () => {
  it("answers user null without cookies and without calling the backend", async () => {
    const res = await server.handlers.me(new NextRequest("http://app.test/api/auth/me"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { user: null } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes once on a 401, rotates the cookies and keeps the user", async () => {
    fetchMock
      .mockResolvedValueOnce(answer(401, { message: "expired" }))
      .mockResolvedValueOnce(answer(200, { data: tokens() }))
      .mockResolvedValueOnce(answer(200, { data: user }));
    const res = await server.handlers.me(
      new NextRequest("http://app.test/api/auth/me", {
        headers: { cookie: `t_access=old; t_refresh=r1` },
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.user).toEqual(user);
    expect(cookieHeader(res)).toMatch(/t_access=/);
    expect(fetchMock.mock.calls[1][0]).toBe("http://backend.test/auth/refresh");
  });

  it("clears the session only when the refresh itself fails", async () => {
    fetchMock.mockResolvedValueOnce(answer(401)).mockResolvedValueOnce(answer(401));
    const res = await server.handlers.me(
      new NextRequest("http://app.test/api/auth/me", {
        headers: { cookie: `t_access=old; t_refresh=dead` },
      })
    );
    expect(await res.json()).toEqual({ data: { user: null } });
    expect(cookieHeader(res)).toMatch(/t_access=;.*Max-Age=0/);
  });
});

describe("proxy", () => {
  const proxy = (path: string[], init: RequestInit & { cookie?: string } = {}) =>
    server.handlers.proxy(
      new NextRequest(`http://app.test/api/backend/${path.join("/")}`, {
        method: init.method ?? "GET",
        headers: {
          origin: "http://app.test",
          host: "app.test",
          ...(init.cookie ? { cookie: init.cookie } : {}),
        },
        body: init.body,
      }),
      { params: Promise.resolve({ path }) }
    );

  it("refuses paths outside the allow-list, including traversal", async () => {
    for (const path of [
      ["api", "v1", "admin", "me"],
      ["api", "v1", "examples", "../admin", "me"],
      ["api", "v1", "examples", "..", "admin"],
    ]) {
      expect((await proxy(path)).status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards an allowed path with the access cookie as Bearer", async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { data: [] }));
    const res = await proxy(["api", "v1", "examples"], { cookie: "t_access=abc" });
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend.test/api/v1/examples");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer abc");
  });

  it("passes a 204 through without a body", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const res = await proxy(["api", "v1", "examples", "1"], {
      method: "DELETE",
      cookie: "t_access=abc",
    });
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });

  it("does not end the session when the endpoint itself answers 401 after a good refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(answer(401))
      .mockResolvedValueOnce(answer(200, { data: tokens() }))
      .mockResolvedValueOnce(answer(401, { message: "scope" }));
    const res = await proxy(["api", "v1", "examples"], { cookie: "t_access=old; t_refresh=r2" });
    expect(res.status).toBe(401);
    expect(cookieHeader(res)).not.toMatch(/Max-Age=0/);
    expect(cookieHeader(res)).toMatch(/t_refresh=/);
  });

  it("shares one refresh between concurrent requests with the same refresh token", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/auth/refresh")) return answer(200, { data: tokens() });
      return answer(
        fetchMock.mock.calls.filter((c) => !String(c[0]).endsWith("/auth/refresh")).length <= 2
          ? 401
          : 200,
        {
          data: [],
        }
      );
    });
    await Promise.all([
      proxy(["api", "v1", "examples"], { cookie: "t_access=old; t_refresh=shared" }),
      proxy(["api", "v1", "examples"], { cookie: "t_access=old; t_refresh=shared" }),
    ]);
    const refreshCalls = fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
  });

  it("refuses a body over the proxy cap", async () => {
    const res = await proxy(["api", "v1", "examples"], {
      method: "POST",
      cookie: "t_access=abc",
      body: "x".repeat(1000),
    });
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
