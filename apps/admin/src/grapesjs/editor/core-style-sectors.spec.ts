import grapesjs, { type Editor } from "grapesjs";
import { CORE_STYLE_SECTORS } from "./core-style-sectors";

type SectorProperty = NonNullable<(typeof CORE_STYLE_SECTORS)[number]["properties"]>[number];

/** The built-in property a sector entry names, by id or through `extend`. */
const builtInId = (property: SectorProperty) =>
  typeof property === "string" ? property : (property as { extend?: string }).extend;

describe("CORE_STYLE_SECTORS", () => {
  let editor: Editor;

  beforeAll(() => {
    editor = grapesjs.init({
      headless: true,
      storageManager: false,
      styleManager: { sectors: CORE_STYLE_SECTORS },
    });
  });

  afterAll(() => editor.destroy());

  it("lists the eight sectors in order", () => {
    expect(editor.Styles.getSectors().map((sector) => sector.getName())).toEqual([
      "Layout",
      "Size",
      "Space",
      "Position",
      "Typography",
      "Background",
      "Borders",
      "Effects",
    ]);
  });

  it("builds every property from a core built-in", () => {
    const unknown = CORE_STYLE_SECTORS.flatMap((sector) => sector.properties ?? [])
      .map(builtInId)
      .filter((id) => !id || !editor.Styles.getBuiltIn(id));

    expect(unknown).toEqual([]);
  });

  it("detaches padding, margin and border-radius so edits write longhands", () => {
    const detached = editor.Styles.getSectors()
      .map((sector) => sector.getProperties())
      .flat()
      .filter((property) => property.get("detached"))
      .map((property) => property.getId());

    expect(detached).toEqual(expect.arrayContaining(["padding", "margin", "border-radius"]));
  });
});
