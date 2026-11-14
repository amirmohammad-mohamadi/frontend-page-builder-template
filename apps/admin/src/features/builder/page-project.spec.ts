import { fromProjectData, toProjectData } from "./page-project";

const components = [{ type: "section", components: [{ type: "heading" }] }];
const styles = [{ selectors: ["#a"], style: { color: "red" } }];

describe("toProjectData", () => {
  it("wraps the stored children in one page, one frame and a wrapper, with the rules", () => {
    expect(toProjectData({ components, styles, css: "" })).toEqual({
      pages: [{ frames: [{ component: { type: "wrapper", components } }] }],
      styles,
    });
  });

  it("loads an empty page for a missing or malformed draft", () => {
    expect(toProjectData(null)).toEqual({
      pages: [{ frames: [{ component: { type: "wrapper", components: [] } }] }],
      styles: [],
    });
  });
});

describe("fromProjectData", () => {
  it("reads the wrapper's children, the rules and the given CSS back into the page format", () => {
    const project = toProjectData({ components, styles, css: "" });
    expect(fromProjectData(project, "#a{color:red;}")).toEqual({
      components,
      styles,
      css: "#a{color:red;}",
    });
  });

  it("round-trips a draft through the project shape", () => {
    const draft = { components, styles, css: "x{}" };
    expect(fromProjectData(toProjectData(draft), draft.css)).toEqual(draft);
  });

  it("is empty for a project without pages", () => {
    expect(fromProjectData(undefined, "")).toEqual({ components: [], styles: [], css: "" });
  });
});
