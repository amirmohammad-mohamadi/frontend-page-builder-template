import type { Editor } from "grapesjs";
import type { BuilderTraitDefinition } from "../types";
import { buildFileInput } from "./dom";

/**
 * Re-syncs each rendered field from its trait. Keyed by the field's element, which core caches
 * on the trait model and reuses every time the component is selected again.
 */
const refreshers = new WeakMap<HTMLElement, () => void>();

/**
 * Registers the core `file` trait type: a thumbnail, a URL input written to the attribute once
 * committed (Enter or blur), and "Browse…", which opens the Asset Manager filtered to the
 * field's `accept` kinds. The Studio SDK draws its own file field and never uses this view.
 *
 * @param editor the editor to register the type on
 */
export function registerFileTraitType(editor: Editor): void {
  editor.TraitManager.addType("file", {
    // The field writes through `trait.setValue` itself, so core's change handler stays off,
    // and no core `.gjs-field` wrapper is drawn around it.
    eventCapture: [],
    templateInput: () => "",
    createInput({ trait }) {
      const fileInput = buildFileInput(editor, {
        value: String(trait.getValue() ?? ""),
        accept: (trait.attributes as BuilderTraitDefinition).accept,
        onCommit: (value) => trait.setValue(value),
      });
      const container = document.createElement("div");
      container.className = "pb-trait";
      container.appendChild(fileInput.el);
      refreshers.set(container, () => fileInput.setValue(String(trait.getValue() ?? "")));
      return container;
    },
    onUpdate({ elInput }) {
      refreshers.get(elInput)?.();
    },
  });
}
