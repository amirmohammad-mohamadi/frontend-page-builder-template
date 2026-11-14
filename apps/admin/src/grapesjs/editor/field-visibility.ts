import type { Component, Editor } from "grapesjs";
import { BUILDER_BLOCKS, type FieldBlock, type FieldVisibilityRule } from "@components/builder";
import { toTraits, type BuilderTraitDefinition } from "../fields";

/**
 * Hides the fields of a selected block that do nothing where it sits. A field is hidden by
 * leaving its trait out of the block's trait list: the value lives in the block's attribute,
 * which is never touched, so it is kept and the field shows it again once it works. Core
 * leaves a block's traits out of the stored page and the undo history.
 *
 * The block library declares no rule today; a project adds one per block type here (the
 * rule reads the block's `FieldBlock` ancestry and names the fields to hide).
 */
export const FIELD_VISIBILITY: Readonly<Record<string, FieldVisibilityRule>> = {};

/**
 * The editor events after which the selected block's fields are checked again:
 * a selection, an attribute change (an undo) and a move.
 */
const REFRESH_EVENTS = [
  "component:toggled",
  "component:update:attributes",
  "component:add",
  "component:drag:end",
] as const;

const traitsByType = new Map<string, BuilderTraitDefinition[]>();

/** Every trait of `type`, as its block declares them (built once per type). */
function allTraits(type: string): BuilderTraitDefinition[] {
  let traits = traitsByType.get(type);
  if (!traits) {
    traits = toTraits(BUILDER_BLOCKS[type]?.fields ?? []);
    traitsByType.set(type, traits);
  }
  return traits;
}

/** The component, then each component that holds it, up to the page. */
function ancestryOf(component: Component): FieldBlock[] {
  const ancestry: FieldBlock[] = [];
  for (let current: Component | undefined = component; current; current = current.parent()) {
    ancestry.push({ type: current.get("type") ?? "", attributes: current.getAttributes() });
  }
  return ancestry;
}

/**
 * Gives `component` the traits its visibility rule leaves shown, in field order.
 *
 * @param component the selected block
 * @param rules the rules by block type (`FIELD_VISIBILITY` by default)
 * @returns whether the trait list changed
 */
export function syncFieldVisibility(
  component: Component,
  rules: Readonly<Record<string, FieldVisibilityRule>> = FIELD_VISIBILITY
): boolean {
  const type = component.get("type") ?? "";
  const rule = rules[type];
  if (!rule) return false;

  const hidden = new Set(rule(ancestryOf(component)));
  const wanted = ["id", ...allTraits(type).filter((trait) => !hidden.has(trait.name ?? ""))];
  const current = component.getTraits().map((trait) => trait.getName());
  const wantedNames = wanted.map((trait) =>
    typeof trait === "string" ? trait : (trait.name ?? "")
  );
  if (current.join("\n") === wantedNames.join("\n")) return false;

  component.traits.reset(wanted as never);
  return true;
}

/**
 * Keeps the selected block's fields in step with where it sits: on selection, when a block's
 * attributes change, and when a block is moved. A change re-renders the Properties panel
 * through core's own selection event.
 *
 * @param editor the editor
 */
export function registerFieldVisibility(editor: Editor): void {
  const refresh = () => {
    const selected = editor.getSelected();
    if (selected && syncFieldVisibility(selected)) editor.trigger("component:toggled");
  };
  REFRESH_EVENTS.forEach((event) => editor.on(event, refresh));
}
