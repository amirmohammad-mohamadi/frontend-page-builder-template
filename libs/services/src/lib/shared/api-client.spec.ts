import { ApiClientError } from "./api-errors";
import { apiClient, CLIENT_ERROR_CODES, configureApiClientTransport } from "./api-client";

const answer = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  configureApiClientTransport({
    resolveUrl: (path) => `http://backend.test${path}`,
    getAuthToken: () => "tok",
    headers: () => ({ "X-Tenant": "t1" }),
  });
});

describe("apiClient", () => {
  it("resolves the URL through the transport, adds the token and extra headers, and unwraps data", async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { data: { id: 1 } }));
    await expect(apiClient.get<{ id: number }>("/api/v1/examples/1")).resolves.toEqual({ id: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend.test/api/v1/examples/1");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers["X-Tenant"]).toBe("t1");
    expect(init.credentials).toBe("include");
  });

  it("normalises a list through the backend adapter", async () => {
    fetchMock.mockResolvedValueOnce(
      answer(200, {
        data: [{ id: 1 }],
        meta: { current_page: 1, last_page: 3, per_page: 1, total: 3 },
      })
    );
    const list = await apiClient.getList<{ id: number }>("/api/v1/examples");
    expect(list.items).toEqual([{ id: 1 }]);
    expect(list.paginate.lastPage).toBe(3);
  });

  it("maps a refused request onto ApiClientError with status, code, field errors and Retry-After", async () => {
    fetchMock.mockResolvedValueOnce(
      answer(
        422,
        { message: "Invalid", code: "E1", errors: { title: ["Required"] } },
        { "retry-after": "5" }
      )
    );
    const error = await apiClient.post("/api/v1/examples", {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("E1");
    expect(error.errors).toEqual({ title: ["Required"] });
  });

  it("turns a network failure into statusCode 0 with the network code", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const error = await apiClient.get("/x").catch((e) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.statusCode).toBe(0);
    expect(error.code).toBe(CLIENT_ERROR_CODES.NETWORK);
  });

  it("returns undefined for a 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiClient.delete("/api/v1/examples/1")).resolves.toBeUndefined();
  });

  it("aborts a server-side request after its deadline", async () => {
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason))
        )
    );
    const error = await apiClient.get("/slow", { timeoutMs: 20 }).catch((e) => e);
    expect(error.code).toBe(CLIENT_ERROR_CODES.REQUEST_TIMEOUT);
  });
});
