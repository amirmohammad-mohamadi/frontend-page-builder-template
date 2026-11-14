import type { Editor } from "grapesjs";
import { registerColorTraitType } from "./color-trait";
import { registerFileTraitType } from "./file-trait";
import { registerHrefTraitType } from "./href-trait";
import { registerNumberTraitType } from "./number-trait";
import { registerTranslatableTraitType } from "./translatable-trait";

export { installIdTrait } from "./id-trait";

/**
 * Registers every hand-built trait type: the `file`, `href` and `translatable` views core lacks,
 * a `color` view that keeps core's picker from writing on deselect, and a `number` view that
 * writes bare numbers. Must run once per editor before any `addType` call that names these
 * types in its traits. The Studio SDK draws file, link, colour and number fields itself and only
 * uses the `translatable` view.
 *
 * @param editor the editor to register the types on
 */
export function registerAllCustomTraitTypes(editor: Editor): void {
  registerFileTraitType(editor);
  registerHrefTraitType(editor);
  registerTranslatableTraitType(editor);
  registerColorTraitType(editor);
  registerNumberTraitType(editor);
}
