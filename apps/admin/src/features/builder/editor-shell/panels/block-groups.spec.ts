import type { Block } from "grapesjs";
import { toBlockGroups } from "./block-groups";

const block = (id: string, label: string, category?: string) =>
  ({
    getId: () => id,
    getLabel: () => label,
    getCategoryLabel: () => category,
  }) as unknown as Block;

const BLOCKS = [
  block("hero", "Hero", "Marketing"),
  block("section", "Section", "Layout"),
  block("heading", "Heading", "Content"),
  block("video", "Video", "Media"),
  block("extra", "Extra", "Custom"),
  block("loose", "Loose"),
];

describe("toBlockGroups", () => {
  it("orders the library's categories first, then others, then uncategorised blocks", () => {
    expect(toBlockGroups(BLOCKS).map((group) => group.category)).toEqual([
      "Layout",
      "Content",
      "Media",
      "Marketing",
      "Custom",
      "",
    ]);
  });

  it("filters by label or category, case-insensitively, dropping empty groups", () => {
    expect(
      toBlockGroups(BLOCKS, "head").map((group) => [
        group.category,
        group.blocks.map((b) => b.getId()),
      ])
    ).toEqual([["Content", ["heading"]]]);
    expect(toBlockGroups(BLOCKS, "MEDIA").map((group) => group.category)).toEqual(["Media"]);
    expect(toBlockGroups(BLOCKS, "nothing")).toEqual([]);
  });
});
