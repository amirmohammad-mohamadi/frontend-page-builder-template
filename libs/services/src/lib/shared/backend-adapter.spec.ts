import { defaultBackendAdapter } from "./backend-adapter";

describe("defaultBackendAdapter.unwrap", () => {
  it("returns data when wrapped and the body otherwise", () => {
    expect(defaultBackendAdapter.unwrap({ data: { id: 1 } })).toEqual({ id: 1 });
    expect(defaultBackendAdapter.unwrap({ id: 1, name: "x", other: 2, more: 3 })).toEqual({
      id: 1,
      name: "x",
      other: 2,
      more: 3,
    });
    expect(defaultBackendAdapter.unwrap([1, 2])).toEqual([1, 2]);
  });
});

describe("defaultBackendAdapter.readList", () => {
  it("reads snake_case meta pagination", () => {
    const list = defaultBackendAdapter.readList({
      data: [{ id: 1 }],
      meta: { current_page: 2, last_page: 5, per_page: 10, total: 42 },
    });
    expect(list.items).toEqual([{ id: 1 }]);
    expect(list.paginate).toEqual({ currentPage: 2, lastPage: 5, perPage: 10, total: 42 });
  });

  it("reads root-level page/pageSize/total and derives the last page", () => {
    const list = defaultBackendAdapter.readList({
      items: [{ id: 1 }],
      page: 1,
      pageSize: 20,
      total: 45,
    });
    expect(list.paginate).toEqual({ currentPage: 1, perPage: 20, total: 45, lastPage: 3 });
  });

  it("accepts a bare array", () => {
    expect(defaultBackendAdapter.readList([{ id: 1 }])).toEqual({
      items: [{ id: 1 }],
      paginate: {},
    });
  });
});

describe("defaultBackendAdapter.readError", () => {
  it("keys field errors from a map of arrays, a map of strings and a list of entries", () => {
    expect(
      defaultBackendAdapter.readError(
        { message: "Invalid", errors: { email: ["Required"] } },
        422,
        ""
      ).errors
    ).toEqual({
      email: ["Required"],
    });
    expect(
      defaultBackendAdapter.readError(
        { message: "Invalid", errors: { email: "Required" } },
        422,
        ""
      ).errors
    ).toEqual({
      email: ["Required"],
    });
    expect(
      defaultBackendAdapter.readError(
        {
          message: "Invalid",
          errors: [
            { field_name: "email", errors: ["Required"] },
            { path: "name", message: "Short" },
          ],
        },
        422,
        ""
      ).errors
    ).toEqual({ email: ["Required"], name: ["Short"] });
  });

  it("falls back to the status text and keeps the status", () => {
    const error = defaultBackendAdapter.readError(undefined, 502, "Bad Gateway");
    expect(error).toEqual({
      message: "Bad Gateway",
      statusCode: 502,
      code: undefined,
      errors: undefined,
    });
  });
});
