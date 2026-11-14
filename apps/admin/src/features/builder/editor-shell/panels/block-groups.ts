import type { Block } from "grapesjs";

/** The palette's categories, in the order the block library names them. */
export const BLOCK_CATEGORY_ORDER = ["Layout", "Content", "Media", "Marketing"] as const;

/** One category of the palette. `category` is empty for blocks registered without one. */
export type BlockGroup = {
  category: string;
  blocks: Block[];
};

/**
 * Groups the editor's blocks for the palette: the known categories first in library order,
 * then any other category in the order its first block appears, then uncategorised blocks.
 * Blocks keep the editor's order inside a category. `query` keeps the blocks whose label or
 * category contains it (case-insensitive); groups left empty are dropped.
 *
 * @param blocks every block of the editor
 * @param query the search text
 */
export function toBlockGroups(blocks: Block[], query = ""): BlockGroup[] {
  const needle = query.trim().toLowerCase();
  const byCategory = new Map<string, Block[]>(
    BLOCK_CATEGORY_ORDER.map((category) => [category, []])
  );

  blocks.forEach((block) => {
    // Core returns `undefined` for a block registered without a label or category.
    const category = block.getCategoryLabel() ?? "";
    const matches =
      !needle ||
      (block.getLabel() ?? "").toLowerCase().includes(needle) ||
      category.toLowerCase().includes(needle);
    if (!matches) return;

    const group = byCategory.get(category);
    if (group) group.push(block);
    else byCategory.set(category, [block]);
  });

  // Map keeps insertion order, so only the uncategorised group needs moving to the end.
  const groups = [...byCategory].map(([category, items]) => ({ category, blocks: items }));
  return [
    ...groups.filter((group) => group.category),
    ...groups.filter((group) => !group.category),
  ].filter((group) => group.blocks.length > 0);
}
