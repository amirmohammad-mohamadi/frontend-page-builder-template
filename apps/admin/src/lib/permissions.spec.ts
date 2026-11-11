import { decideAccess, routePermissions, ROUTE_PERMISSIONS } from "./permissions";

describe("routePermissions", () => {
  afterEach(() => {
    for (const key of Object.keys(ROUTE_PERMISSIONS)) delete ROUTE_PERMISSIONS[key];
  });

  it("is null for every path while the map is empty", () => {
    expect(routePermissions("/examples")).toBeNull();
  });

  it("picks the longest matching prefix", () => {
    Object.assign(ROUTE_PERMISSIONS, {
      "/settings": ["settings.view"],
      "/settings/billing": ["billing.manage"],
    });
    expect(routePermissions("/settings/billing/invoices")).toEqual(["billing.manage"]);
    expect(routePermissions("/settings/general")).toEqual(["settings.view"]);
    expect(routePermissions("/settingsx")).toBeNull();
  });
});

describe("decideAccess", () => {
  it("allows when nothing is required", () => {
    expect(decideAccess(null, "ready", [])).toBe("allowed");
    expect(decideAccess([], "loading", undefined)).toBe("allowed");
  });

  it("is pending while loading, fails open without permissions, decides otherwise", () => {
    expect(decideAccess(["a"], "loading", undefined)).toBe("pending");
    expect(decideAccess(["a"], "ready", undefined)).toBe("allowed");
    expect(decideAccess(["a", "b"], "ready", ["b"])).toBe("allowed");
    expect(decideAccess(["a"], "ready", ["c"])).toBe("denied");
  });
});
