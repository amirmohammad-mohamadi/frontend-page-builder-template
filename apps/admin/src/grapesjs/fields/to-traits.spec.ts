import { BUILDER_BLOCK_LIST, defineFields, type FieldDef } from "@components/builder";
import { toTrait, toTraits } from "./to-traits";

const FIELDS: FieldDef[] = [
  ...defineFields([
    { name: "title", label: "Title", type: "text", category: "Content", translatable: true },
    { name: "body", label: "Body", type: "textarea", translatable: true, default: "x" },
    { name: "html", label: "Text", type: "richtext", translatable: true },
    { name: "note", label: "Note", type: "text", placeholder: "Plain" },
    { name: "count", label: "Count", type: "number", min: 1, max: 4, step: 1 },
    { name: "open", label: "Open", type: "checkbox", default: "false" },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: [
        { id: "start", label: "Start" },
        { id: "end", label: "End" },
      ],
    },
    { name: "tone", label: "Tone", type: "color" },
    { name: "src", label: "Image", type: "image", accept: "image" },
    { name: "clip", label: "Video", type: "video" },
    { name: "poster", label: "Poster", type: "image", accept: "image,video" },
    { name: "href", label: "Link", type: "href", default: "#" },
    { name: "tags", label: "Tags", type: "list" },
  ]),
];

const traitFor = (name: string) => {
  const trait = toTraits(FIELDS).find((t) => t.name === name);
  if (!trait) throw new Error(`no ${name} trait`);
  return trait;
};

describe("toTraits", () => {
  it("names every trait after its field and keeps label, category, placeholder and default", () => {
    expect(toTraits(FIELDS).map((t) => t.name)).toEqual(FIELDS.map((f) => f.name));
    expect(traitFor("title")).toMatchObject({ label: "Title", category: "Content" });
    expect(traitFor("note")).toMatchObject({ type: "text", placeholder: "Plain" });
    expect(traitFor("body").default).toBe("x");
  });

  it("turns translatable text kinds into translatable traits with the kind as the variant", () => {
    expect(traitFor("title")).toMatchObject({ type: "translatable", variant: "text" });
    expect(traitFor("body")).toMatchObject({ type: "translatable", variant: "textarea" });
    expect(traitFor("html")).toMatchObject({ type: "translatable", variant: "richtext" });
    expect(traitFor("note").type).toBe("text");
  });

  it("maps numbers with their range and checkboxes to the string booleans the blocks read", () => {
    expect(traitFor("count")).toMatchObject({ type: "number", min: 1, max: 4, step: 1 });
    expect(traitFor("open")).toMatchObject({
      type: "checkbox",
      valueTrue: "true",
      valueFalse: "false",
    });
  });

  it("gives a select its options with id and value", () => {
    expect(traitFor("align")).toMatchObject({
      type: "select",
      options: [
        { id: "start", value: "start", label: "Start" },
        { id: "end", value: "end", label: "End" },
      ],
    });
  });

  it("maps media fields to the file trait with the accepted kinds, defaulting to the field kind", () => {
    expect(traitFor("src")).toMatchObject({ type: "file", accept: "image" });
    expect(traitFor("clip")).toMatchObject({ type: "file", accept: "video" });
    expect(traitFor("poster")).toMatchObject({ type: "file", accept: "image,video" });
  });

  it("keeps colour and href on their own trait types and edits a list as text", () => {
    expect(traitFor("tone").type).toBe("color");
    expect(traitFor("href")).toMatchObject({ type: "href", default: "#" });
    expect(traitFor("tags")).toMatchObject({ type: "text", placeholder: expect.any(String) });
  });

  it("records the field kind each trait came from", () => {
    expect(toTrait(FIELDS[0]).fieldType).toBe("text");
    expect(toTrait(FIELDS[8]).fieldType).toBe("image");
  });

  it("derives traits for every block of the library without an unknown type", () => {
    const known = new Set([
      "translatable",
      "text",
      "textarea",
      "number",
      "select",
      "checkbox",
      "color",
      "file",
      "href",
    ]);
    BUILDER_BLOCK_LIST.forEach((block) => {
      toTraits(block.fields).forEach((trait) => expect(known.has(trait.type ?? "")).toBe(true));
    });
  });
});
