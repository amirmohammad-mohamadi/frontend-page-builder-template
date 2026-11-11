import { BUILDER_BLOCKS } from "./blocks";
import { fieldsToProps } from "./fields/to-props";
import { translatableFieldNames, type LocaleContext } from "./fields/translatable";

export {
  FALLBACK_LOCALE,
  parseTranslatable,
  resolveTranslatable,
  serializeTranslatable,
  setTranslation,
  translatableFieldNames,
} from "./fields/translatable";
export type { LocaleContext, TranslatableText } from "./fields/translatable";
export { defineFields, fieldDefaults, fieldsToProps } from "./fields/to-props";

/**
 * The translatable attributes of every block type, derived from the block
 * definitions (fields with `translatable: true`): the list the editor's
 * translation UI, the canvas and the web renderer share. One page tree holds
 * every language; each of these attributes stores a locale record.
 */
export const TRANSLATABLE_FIELDS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.values(BUILDER_BLOCKS).map((block) => [block.type, translatableFieldNames(block.fields)])
);

/**
 * Turns a stored component's attributes into the typed props its block reads,
 * by the block's field definitions (see `fieldsToProps`). An unknown type gets
 * `{}`.
 *
 * @param type the block type (`heading`, `feature-card`, …)
 * @param attributes the component's stored attributes
 * @param context the locale being rendered and the fallback locale
 */
export function toBlockProps(
  type: string,
  attributes: Record<string, unknown> | undefined,
  context: LocaleContext
): Record<string, unknown> {
  const block = BUILDER_BLOCKS[type];
  if (!block) return {};
  return fieldsToProps(block.fields, attributes, context);
}
