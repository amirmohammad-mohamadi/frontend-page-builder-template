import type { Editor } from "grapesjs";
import { installIdTrait, toElementId } from "./id-trait";

describe("toElementId", () => {
  it("trims and turns each run of whitespace into one hyphen", () => {
    expect(toElementId("hero title block")).toBe("hero-title-block");
    expect(toElementId("  two \t words  ")).toBe("two-words");
    expect(toElementId("hero-title")).toBe("hero-title");
  });

  it("is empty for blank input", () => {
    expect(toElementId("   ")).toBe("");
    expect(toElementId(undefined)).toBe("");
    expect(toElementId(null)).toBe("");
  });
});

type SetValue = (props: { value: unknown; component: unknown; emitUpdate: () => void }) => void;

/**
 * A component with an Id trait, its attribute writes recorded, and an editor that hands the
 * selection handler and the id list to the test.
 */
const setup = (attributes: Record<string, unknown>, ids: string[] = []) => {
  const writes: Record<string, unknown>[] = [];
  let traitSetValue: SetValue | undefined;
  const trait = {
    get: (key: string) => (key === "setValue" ? traitSetValue : undefined),
    set: (props: { setValue: SetValue }) => {
      traitSetValue = props.setValue;
    },
  };
  const component = {
    attributes: { ...attributes },
    getId() {
      return String(this.attributes.id ?? "ccid1");
    },
    get(key: string) {
      return key === "attributes" ? this.attributes : undefined;
    },
    set(_key: string, next: Record<string, unknown>) {
      writes.push(next);
      this.attributes = next;
    },
    getTrait: (name: string) => (name === "id" ? trait : null),
  };
  let onSelected: ((c: unknown) => void) | undefined;
  const editor = {
    on: (event: string, handler: (c: unknown) => void) => {
      if (event === "component:selected") onSelected = handler;
    },
    Components: { allById: () => Object.fromEntries(ids.map((id) => [id, {}])) },
  } as unknown as Editor;
  installIdTrait(editor);
  onSelected?.(component);
  const emitUpdate = jest.fn();
  const type = (value: unknown) => traitSetValue?.({ value, component, emitUpdate });
  return { component, writes, type, emitUpdate, setValue: () => traitSetValue };
};

describe("installIdTrait", () => {
  it("attaches its writer to the selected component's Id trait", () => {
    const { setValue } = setup({});
    expect(typeof setValue()).toBe("function");
  });

  it("writes the current id out first, then the new id without spaces, in one call", () => {
    const { writes, type, emitUpdate, component } = setup({ title: "t" });
    type("hero title block");
    expect(writes).toEqual([
      { title: "t", id: "ccid1", __p: null },
      { title: "t", id: "hero-title-block" },
    ]);
    expect(component.getId()).toBe("hero-title-block");
    expect(emitUpdate).toHaveBeenCalledTimes(1);
  });

  it("changes core's undo marker even when it is already null", () => {
    const { writes, type } = setup({ id: "hero", __p: null });
    type("hero two");
    expect(writes[0]).toEqual({ id: "hero", __p: undefined });
    expect(writes[1]).toEqual({ id: "hero-two" });
  });

  it("refuses an id another component holds, an empty id and an unchanged one", () => {
    const { writes, type, emitUpdate } = setup({ id: "hero" }, ["hero", "footer"]);
    type("footer");
    type("   ");
    type(" hero ");
    expect(writes).toEqual([]);
    // Each refusal shows the id the component keeps.
    expect(emitUpdate).toHaveBeenCalledTimes(3);
  });
});
