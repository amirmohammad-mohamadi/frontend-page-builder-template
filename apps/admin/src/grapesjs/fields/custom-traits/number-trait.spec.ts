import type { Editor } from "grapesjs";
import { registerNumberTraitType, toNumberAttribute } from "./number-trait";

describe("toNumberAttribute", () => {
  it.each([
    ["512", "512"],
    ["1.5", "1.5"],
    ["007", "7"],
    ["12px", "12"],
    ["-3", "-3"],
    ["0", "0"],
  ])("writes %p as the decimal string %p", (input, expected) => {
    expect(toNumberAttribute(input)).toBe(expected);
  });

  it("keeps text that is not a number, and writes an empty string when cleared", () => {
    expect(toNumberAttribute("abc")).toBe("abc");
    expect(toNumberAttribute("")).toBe("");
    expect(toNumberAttribute(undefined)).toBe("");
  });

  it("passes numbers through as strings", () => {
    expect(toNumberAttribute(400)).toBe("400");
  });
});

/** Core's number view as far as the override relies on it: `value + unit`, as core writes. */
class CoreNumberView {
  constructor(public model: { get: (key: string) => unknown }) {}

  getValueForTarget(): unknown {
    return `${this.model.get("value")}${this.model.get("unit") ?? ""}`;
  }
}

/** Registers the view on a stub editor and returns one bound to the given trait values. */
const viewFor = (values: Record<string, unknown>) => {
  const types: Record<string, unknown> = { number: CoreNumberView };
  registerNumberTraitType({
    TraitManager: { types, getType: (name: string) => types[name] },
  } as unknown as Editor);
  const View = types.number as typeof CoreNumberView;
  return new View({ get: (key) => values[key] });
};

describe("registerNumberTraitType", () => {
  it("replaces core's number view with one that writes the bare number", () => {
    expect(viewFor({ value: "512" }).getValueForTarget()).toBe("512");
  });

  it("leaves a field with a unit to core", () => {
    expect(viewFor({ value: "12", unit: "px" }).getValueForTarget()).toBe("12px");
  });
});
