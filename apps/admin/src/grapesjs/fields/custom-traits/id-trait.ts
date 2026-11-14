import type { Component, Editor, TraitProperties } from "grapesjs";

/**
 * An element id as the Id trait stores it: trimmed, each run of whitespace
 * one hyphen (`"hero title"` → `"hero-title"`), since an HTML id holds no
 * spaces. Empty when nothing but whitespace was typed.
 *
 * @param raw the typed value
 */
export function toElementId(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "-");
}

type IdTraitSetValue = NonNullable<TraitProperties["setValue"]>;

/**
 * Writes a new id so one Undo restores the old one. Core's write records the
 * attributes from before the last change it skipped (often none, when the id
 * was only the generated one), and restoring an id-less snapshot makes core
 * roll the new id back in. So the current id is first written out with a
 * change of the `__p` marker core itself uses to make a write count, then the
 * new id replaces it; both run in one call, so the Undo Manager fuses them
 * into one step that ends on the old id.
 */
function writeElementId(component: Component, current: string, next: string): void {
  const attributes: Record<string, unknown> = { ...component.get("attributes") };
  component.set("attributes", {
    ...attributes,
    id: current,
    __p: attributes.__p === null ? undefined : null,
  });
  delete attributes.__p;
  component.set("attributes", { ...attributes, id: next });
}

/**
 * Makes every component's Id trait store ids without spaces and undoable in
 * one step, like the other traits. An id another component already holds,
 * or an empty one, is refused (core would roll it back anyway); the field
 * then shows the id the component keeps. Installed on selection because core
 * types declare the trait as the plain string `"id"`.
 *
 * @param editor the editor to install the writer on
 */
export function installIdTrait(editor: Editor): void {
  const setValue: IdTraitSetValue = ({ value, component, emitUpdate }) => {
    const current = component.getId();
    const next = toElementId(value);
    const taken = next !== current && Boolean(editor.Components.allById()[next]);
    if (next && next !== current && !taken) writeElementId(component, current, next);
    emitUpdate();
  };

  editor.on("component:selected", (component: Component) => {
    const trait = component.getTrait("id");
    if (trait && trait.get("setValue") !== setValue) {
      trait.set({ setValue }, { silent: true });
    }
  });
}
