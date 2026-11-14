import type { Editor } from "grapesjs";

/**
 * The attribute string a number field stores: the decimal of the number its text starts with
 * (`"512"` → `"512"`, `"007"` → `"7"`, `"12px"` → `"12"`), else the text itself (`""` when the
 * field is cleared). Blocks read numbers through `fieldsToProps`, which parses the string.
 *
 * @param raw the input's text
 */
export function toNumberAttribute(raw: unknown): string {
  const text = raw == null ? "" : String(raw);
  const value = parseFloat(text);
  return Number.isNaN(value) ? text : String(value);
}

/**
 * Replaces core's `number` trait view with one that writes the bare number: core's own view
 * writes the input text plus its unit, so `12` with a stray unit would be stored as `12px`.
 * A field that declares a unit keeps core's behaviour.
 *
 * @param editor the editor whose `number` view is replaced
 */
export function registerNumberTraitType(editor: Editor): void {
  const CoreNumberView = editor.TraitManager.getType("number");

  class NumberTraitView extends CoreNumberView {
    override getValueForTarget() {
      if (this.model.get("unit")) return super.getValueForTarget();
      return toNumberAttribute(this.model.get("value"));
    }
  }

  editor.TraitManager.types.number = NumberTraitView;
}
