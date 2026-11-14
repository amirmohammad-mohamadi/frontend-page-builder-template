import type { Editor } from "grapesjs";
import { TEXTS } from "@/texts";

/**
 * Registers the core `href` trait type: one URL input whose text is written to the attribute
 * as a plain string once committed (Enter or blur), through core's own text-trait handling.
 * Root paths, `#`, `mailto:` and `tel:` are typed as they are. The Studio SDK draws its own
 * link field and never uses this view.
 *
 * @param editor the editor to register the type on
 */
export function registerHrefTraitType(editor: Editor): void {
  editor.TraitManager.addType("href", {
    createInput({ trait }) {
      const input = document.createElement("input");
      input.type = "url";
      input.placeholder = String(
        trait.get("placeholder") || trait.get("default") || TEXTS.builder.traits.hrefPlaceholder
      );
      input.value = String(trait.getValue() ?? "");
      return input;
    },
    onUpdate({ elInput, trait }) {
      elInput.value = String(trait.getValue() ?? "");
    },
  });
}
