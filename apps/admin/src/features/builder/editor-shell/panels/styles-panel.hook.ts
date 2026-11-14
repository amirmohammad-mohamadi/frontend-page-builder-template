import type { Editor } from "grapesjs";
import { useEffect, type RefObject } from "react";
import { useEditorEvents } from "../../use-editor-events";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
  /** The slot core's ClassTagsView is appended into (`selectorManager.appendTo`). */
  selectorsRef: RefObject<HTMLDivElement | null>;
};

const SELECTION_EVENTS = "component:toggled";

/**
 * Drives the Styles tab around core's default SelectorManager and StyleManager views: whether
 * there is a selection to style, and a clean-up of core's duplicate selector view.
 */
export const useStylesPanel = ({ editor, selectorsRef }: Props) => {
  const hasSelection = useEditorEvents(
    editor,
    SELECTION_EVENTS,
    (current) => !!current.getSelected(),
    false
  );

  // grapesjs 0.22.16 lists SelectorManager twice in its modules, so its postRender appends two
  // selector views to the slot at init; only the last one is still wired to the module.
  useEffect(() => {
    const slot = selectorsRef.current;
    if (!editor || !slot) return;
    while (slot.childElementCount > 1) slot.firstElementChild?.remove();
  }, [editor, selectorsRef]);

  return { hasSelection };
};
