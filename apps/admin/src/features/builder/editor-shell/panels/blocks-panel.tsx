"use client";

import type { Block, Editor } from "grapesjs";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { BUILDER_BLOCKS } from "@components/builder";
import { Input } from "@components";
import { paletteIcon } from "@/grapesjs/editor/palette-icons";
import { TEXTS } from "@/texts";
import type { BlockGroup } from "./block-groups";
import { useBlocksPanel } from "./blocks-panel.hook";

type Props = {
  editor: Editor | null;
};

type TileHandlers = Pick<
  ReturnType<typeof useBlocksPanel>,
  "startDrag" | "endDrag" | "appendBlock"
>;

/**
 * The Blocks tab: every palette block by category, with search. Drag a tile onto the canvas,
 * or click it (Enter, Space) to append it to the selection or the page.
 */
export function BlocksPanel({ editor }: Props) {
  const t = TEXTS.builder.shell;
  const vm = useBlocksPanel({ editor });

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={vm.query}
          onChange={(event) => vm.setQuery(event.target.value)}
          placeholder={t.blocksSearch}
          aria-label={t.blocksSearch}
          className="ps-8"
        />
      </div>
      {vm.groups.length === 0 ? (
        <p className="text-muted-foreground p-2 text-sm">
          {vm.searching ? t.blocksNoMatch : t.blocksEmpty}
        </p>
      ) : (
        vm.groups.map((group) =>
          renderGroup(group, vm.isCollapsed(group.category), vm.toggleCategory, vm)
        )
      )}
    </div>
  );
}

/** A collapsible category: its header button with the block count, then its tiles. */
function renderGroup(
  group: BlockGroup,
  collapsed: boolean,
  onToggle: (category: string) => void,
  handlers: TileHandlers
) {
  const title = group.category || TEXTS.builder.shell.blocksUncategorised;
  return (
    <section key={group.category}>
      <button
        type="button"
        aria-expanded={!collapsed}
        onClick={() => onToggle(group.category)}
        className="text-muted-foreground hover:bg-accent/60 focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-xs font-semibold tracking-wide uppercase outline-none focus-visible:ring-[3px]"
      >
        <ChevronDownIcon
          className="size-4 shrink-0 transition-transform data-[collapsed]:-rotate-90"
          data-collapsed={collapsed || undefined}
        />
        <span className="flex-1 truncate">{title}</span>
        <span className="tabular-nums">{group.blocks.length}</span>
      </button>
      {!collapsed ? (
        <ul className="grid grid-cols-2 gap-1.5 p-1">
          {group.blocks.map((block) => renderTile(block, handlers))}
        </ul>
      ) : null}
    </section>
  );
}

/** One block: its lucide icon over its label, draggable and clickable. */
function renderTile(block: Block, { startDrag, endDrag, appendBlock }: TileHandlers) {
  const Icon = paletteIcon(BUILDER_BLOCKS[block.getId()]?.icon);
  return (
    <li key={block.getId()}>
      <button
        type="button"
        draggable
        data-block-id={block.getId()}
        title={TEXTS.builder.shell.blocksTileHint}
        onDragStart={(event) => startDrag(block, event)}
        onDragEnd={endDrag}
        onClick={() => appendBlock(block)}
        className="bg-background hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-ring/50 flex h-20 w-full cursor-grab flex-col items-center justify-center gap-1.5 rounded-md border p-2 text-center text-xs outline-none transition-colors focus-visible:ring-[3px] active:cursor-grabbing"
      >
        <Icon aria-hidden className="text-muted-foreground size-6" />
        <span className="line-clamp-2 w-full">{block.getLabel()}</span>
      </button>
    </li>
  );
}
