import type { Editor } from "grapesjs";
import {
  BUILDER_BLOCK_LIST,
  BUILDER_BLOCKS,
  FaqBlock,
  FaqItemBlock,
  HeroBlock,
} from "@components/builder";
import { blockContent, canDrop, registerBuilderBlocks } from "./builder-plugin";

const typed = (type: string) => ({ get: () => type });

describe("canDrop", () => {
  it("lets a child block into its parent only", () => {
    expect(canDrop(BUILDER_BLOCKS, typed("faq-item"), typed("faq"))).toBe(true);
    expect(canDrop(BUILDER_BLOCKS, typed("faq-item"), typed("section"))).toBe(false);
    expect(canDrop(BUILDER_BLOCKS, typed("faq-item"), undefined)).toBe(false);
  });

  it("lets a container with named children take only those", () => {
    expect(canDrop(BUILDER_BLOCKS, typed("heading"), typed("faq"))).toBe(false);
    expect(canDrop(BUILDER_BLOCKS, typed("column"), typed("columns"))).toBe(true);
  });

  it("lets any block into an open container and the page root, and none into a leaf", () => {
    expect(canDrop(BUILDER_BLOCKS, typed("hero"), typed("section"))).toBe(true);
    expect(canDrop(BUILDER_BLOCKS, typed("hero"), typed("wrapper"))).toBe(true);
    expect(canDrop(BUILDER_BLOCKS, typed("heading"), typed("hero"))).toBe(false);
  });
});

describe("blockContent", () => {
  it("is the block's type with its initial children", () => {
    expect(blockContent(HeroBlock)).toEqual({ type: "hero", components: [] });
    expect(blockContent(FaqBlock)).toEqual({ type: "faq", components: FaqBlock.initialChildren });
    expect(blockContent(FaqItemBlock).components).toEqual([]);
  });
});

describe("registerBuilderBlocks", () => {
  it("replaces every existing block, same ids included, with the library's blocks", () => {
    const store = new Map<string, Record<string, unknown>>([
      ["form", { category: "Forms" }],
      ["text", { category: "Basic" }],
    ]);
    const editor = {
      Blocks: {
        getAll: () => ({
          models: [...store.keys()].map((id) => ({ getId: () => id, set: () => undefined })),
        }),
        remove: (id: string) => store.delete(id),
        add: (id: string, props: Record<string, unknown>) => store.set(id, props),
      },
      // The palette icons are filled on the next tick; a destroyed editor skips that.
      em: { destroyed: true },
    } as unknown as Editor;

    registerBuilderBlocks(editor);

    expect([...store.keys()].sort()).toEqual(BUILDER_BLOCK_LIST.map((b) => b.type).sort());
    expect(store.get("text")?.category).toBe(BUILDER_BLOCKS["text"]?.category);
  });
});
