import type { Editor } from "grapesjs";
import { useCallback, useEffect, useSyncExternalStore, type RefObject } from "react";

/** What the Properties tab shows: core's traits view, or one of its two empty states. */
export type TraitsPanelStatus = "no-selection" | "empty" | "traits";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
  /** The slot core's TraitsView is appended into (`traitManager.appendTo`). */
  slotRef: RefObject<HTMLDivElement | null>;
};

// Core's markup under the default `gjs-` prefix (grapesjs 0.22.16 TraitsView + ModuleCategoryView).
const CATEGORY_TITLE_SELECTOR = ".gjs-trait-category > [data-title]";
const CATEGORY_OPEN_CLASS = "gjs-open";
const SELECTION_EVENTS = ["component:selected", "component:deselected"] as const;

/** Reads the Properties tab state from the editor's current selection. */
function readStatus(editor: Editor | null): TraitsPanelStatus {
  const selected = editor?.getSelected();
  if (!selected) return "no-selection";
  return selected.getTraits().length ? "traits" : "empty";
}

/**
 * Gives core's category headers (plain clickable divs) button semantics: focusable, announced
 * as buttons, and `aria-expanded` following core's open class. Writes only what changed.
 */
function syncCategoryHeaders(slot: HTMLElement) {
  slot.querySelectorAll<HTMLElement>(CATEGORY_TITLE_SELECTOR).forEach((title) => {
    const expanded = String(title.parentElement?.classList.contains(CATEGORY_OPEN_CLASS) ?? false);
    if (title.getAttribute("aria-expanded") !== expanded) {
      title.setAttribute("aria-expanded", expanded);
    }
    if (title.getAttribute("role") !== "button") {
      title.setAttribute("role", "button");
      title.tabIndex = 0;
    }
  });
}

/**
 * Drives the Properties tab around core's TraitsView: the empty state from the selection
 * (`component:selected` / `component:deselected`), and keyboard access to the category headers
 * core re-renders on every selection. Collapsing, grouping and Enter-to-commit stay core's.
 */
export const useTraitsPanel = ({ editor, slotRef }: Props) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!editor) return () => undefined;
      SELECTION_EVENTS.forEach((event) => editor.on(event, onChange));
      return () => SELECTION_EVENTS.forEach((event) => editor.off(event, onChange));
    },
    [editor]
  );
  const status = useSyncExternalStore<TraitsPanelStatus>(
    subscribe,
    () => readStatus(editor),
    () => "no-selection"
  );

  // Core rebuilds the headers on each selection and toggles `gjs-open` on click, so the
  // header semantics are re-applied whenever the slot's tree or a class in it changes.
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    syncCategoryHeaders(slot);
    const observer = new MutationObserver(() => syncCategoryHeaders(slot));
    observer.observe(slot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    // Enter / Space on a focused header toggles it through core's own click handler.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches(CATEGORY_TITLE_SELECTOR)) return;
      event.preventDefault();
      target.click();
    };
    slot.addEventListener("keydown", onKeyDown);

    return () => {
      observer.disconnect();
      slot.removeEventListener("keydown", onKeyDown);
    };
  }, [slotRef]);

  return { status };
};
