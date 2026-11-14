"use client";

import type { Editor } from "grapesjs";
import { MousePointerClickIcon, SlidersHorizontalIcon, type LucideIcon } from "lucide-react";
import type { RefObject } from "react";
import { TEXTS } from "@/texts";
import { useTraitsPanel } from "./traits-panel.hook";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
  /** The slot core's TraitsView is appended into; must be mounted before `grapesjs.init`. */
  slotRef: RefObject<HTMLDivElement | null>;
};

/**
 * The Properties tab body: core's default TraitsView (grouped into collapsible categories in
 * field order) inside the traits slot, and the "Select a block" / "No properties" states in
 * its place when there is nothing to edit.
 */
export function TraitsPanel({ editor, slotRef }: Props) {
  const t = TEXTS.builder.shell;
  const vm = useTraitsPanel({ editor, slotRef });

  return (
    <div className="builder-traits-panel">
      {vm.status === "no-selection"
        ? renderEmptyState(MousePointerClickIcon, t.traitsNoSelectionTitle, t.traitsNoSelectionBody)
        : null}
      {vm.status === "empty"
        ? renderEmptyState(SlidersHorizontalIcon, t.traitsEmptyTitle, t.traitsEmptyBody)
        : null}
      {/* Always mounted: core appends its view here once, at init, and re-renders inside it. */}
      <div ref={slotRef} data-builder-slot="traits" hidden={vm.status !== "traits"} />
    </div>
  );
}

/** A centred icon, title and hint shown in place of the traits view. */
function renderEmptyState(Icon: LucideIcon, title: string, body: string) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center" role="status">
      <Icon className="text-muted-foreground size-6" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-xs">{body}</p>
    </div>
  );
}
