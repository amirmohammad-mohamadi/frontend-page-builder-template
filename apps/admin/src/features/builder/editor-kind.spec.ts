import { resolveEditorKind } from "./editor-kind";

describe("resolveEditorKind", () => {
  it("mounts Core whenever Core is configured, key or not", () => {
    expect(resolveEditorKind("core", "", "example.com")).toEqual({ kind: "core", notice: false });
    expect(resolveEditorKind("core", "key", "localhost")).toEqual({ kind: "core", notice: false });
  });

  it("mounts Studio with a key anywhere, and without one on localhost", () => {
    expect(resolveEditorKind("studio", "key", "admin.example.com")).toEqual({
      kind: "studio",
      notice: false,
    });
    expect(resolveEditorKind("studio", "", "localhost")).toEqual({ kind: "studio", notice: false });
    expect(resolveEditorKind("studio", " ", "127.0.0.1")).toEqual({
      kind: "studio",
      notice: false,
    });
  });

  it("falls back to Core with a notice when Studio has no key away from localhost", () => {
    expect(resolveEditorKind("studio", "", "admin.example.com")).toEqual({
      kind: "core",
      notice: true,
    });
  });
});
