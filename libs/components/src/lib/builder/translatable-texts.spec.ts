import { BUILDER_BLOCKS } from "./blocks";
import { defineFields, fieldsToProps } from "./fields/to-props";
import { toBlockProps, TRANSLATABLE_FIELDS } from "./translatable-texts";

const FIELDS = defineFields([
  {
    name: "title",
    label: "Title",
    type: "text",
    translatable: true,
    default: '{"en":"Hi","fa":"درود"}',
  },
  { name: "count", label: "Count", type: "number", default: "3" },
  { name: "open", label: "Open", type: "checkbox", default: "false" },
  { name: "tags", label: "Tags", type: "list" },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    default: "muted",
    options: [{ id: "muted", label: "Muted" }],
  },
  { name: "href", label: "Link", type: "href" },
]);

describe("fieldsToProps", () => {
  it("types every field kind from its stored string", () => {
    const props = fieldsToProps(
      FIELDS,
      {
        title: '{"en":"Hello","fa":"سلام"}',
        count: "12",
        open: "true",
        tags: '["a","b"]',
        tone: "accent",
        href: "/about",
      },
      { locale: "fa", defaultLocale: "en" }
    );
    expect(props).toEqual({
      title: "سلام",
      count: 12,
      open: true,
      tags: ["a", "b"],
      tone: "accent",
      href: "/about",
    });
    // The literal field list gives precise types.
    const count: number = props.count;
    const open: boolean = props.open;
    const tags: string[] = props.tags;
    expect([count, open, tags.length]).toEqual([12, true, 2]);
  });

  it("falls back to the field defaults for missing or empty attributes", () => {
    expect(fieldsToProps(FIELDS, { count: "", tags: "x, y" }, { locale: "en" })).toEqual({
      title: "Hi",
      count: 3,
      open: false,
      tags: ["x", "y"],
      tone: "muted",
      href: "",
    });
  });

  it("matches attribute names case-insensitively and tolerates bad numbers", () => {
    const props = fieldsToProps(FIELDS, { TITLE: "Plain", Count: "abc" }, { locale: "fa" });
    expect(props.title).toBe("Plain");
    expect(props.count).toBe(3);
  });
});

describe("toBlockProps and TRANSLATABLE_FIELDS", () => {
  it("resolves a block's attributes by its registered fields", () => {
    const props = toBlockProps(
      "heading",
      { text: '{"en":"About","fa":"درباره"}', level: "3" },
      { locale: "fa", defaultLocale: "en" }
    );
    expect(props).toEqual({ text: "درباره", level: "3", align: "start" });
    expect(toBlockProps("nope", { a: "b" }, { locale: "en" })).toEqual({});
  });

  it("lists the translatable attributes of every block", () => {
    expect(TRANSLATABLE_FIELDS.heading).toEqual(["text"]);
    expect(TRANSLATABLE_FIELDS.hero).toEqual([
      "title",
      "subtitle",
      "imageAlt",
      "primaryLabel",
      "secondaryLabel",
    ]);
    expect(TRANSLATABLE_FIELDS.spacer).toEqual([]);
    expect(Object.keys(TRANSLATABLE_FIELDS).sort()).toEqual(Object.keys(BUILDER_BLOCKS).sort());
  });

  it("only marks text-like fields translatable and gives each a default with en and fa", () => {
    for (const block of Object.values(BUILDER_BLOCKS)) {
      for (const field of block.fields) {
        if (!field.translatable) continue;
        expect(["text", "textarea", "richtext"]).toContain(field.type);
        if (field.default === undefined) continue;
        const record = JSON.parse(field.default) as Record<string, string>;
        expect(Object.keys(record).sort()).toEqual(["en", "fa"]);
      }
    }
  });
});
