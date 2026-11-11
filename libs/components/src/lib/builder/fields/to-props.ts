import { parseBool, parseList, parseNum } from "./parse";
import { FALLBACK_LOCALE, resolveTranslatable, type LocaleContext } from "./translatable";
import type { FieldDef, FieldValues } from "./types";

/** The key of `attributes` that matches `name` regardless of case, if any. */
function findKey(attributes: Record<string, unknown>, name: string): string | undefined {
  if (name in attributes) return name;
  const lower = name.toLowerCase();
  return Object.keys(attributes).find((key) => key.toLowerCase() === lower);
}

/**
 * Turns stored attributes into the typed props a block reads, by its field
 * definitions: numbers are parsed, checkboxes read `"true"` / `"false"`, lists
 * are JSON-parsed, translatable texts are resolved for `locale` and every
 * other field is a string. A missing or empty attribute takes the field's
 * default. Attribute names match case-insensitively, since attributes written
 * from block HTML arrive lowercased.
 *
 * @param fields the block's field definitions (declare them with `defineFields` for precise types)
 * @param attributes the component's stored attributes
 * @param context the locale being rendered and the fallback locale
 */
export function fieldsToProps<const F extends readonly FieldDef[]>(
  fields: F,
  attributes: Record<string, unknown> | undefined,
  context: LocaleContext
): FieldValues<F> {
  const stored = attributes ?? {};
  const defaultLocale = context.defaultLocale ?? FALLBACK_LOCALE;
  const props: Record<string, unknown> = {};

  for (const field of fields) {
    const key = findKey(stored, field.name);
    const raw = key === undefined ? undefined : stored[key];
    const value = raw === undefined || raw === null || raw === "" ? field.default : raw;

    switch (field.type) {
      case "number":
        props[field.name] = parseNum(value, parseNum(field.default, 0));
        break;
      case "checkbox":
        props[field.name] = parseBool(value, parseBool(field.default));
        break;
      case "list":
        props[field.name] = parseList(value);
        break;
      default:
        props[field.name] = field.translatable
          ? resolveTranslatable(value, context.locale, defaultLocale)
          : value === undefined || value === null
            ? ""
            : String(value);
    }
  }

  return props as FieldValues<F>;
}

/**
 * Keeps the literal types of a block's field list, so `fieldsToProps` returns
 * precisely typed props, while checking each entry is a valid `FieldDef`.
 *
 * @param fields the block's fields
 */
export function defineFields<const F extends readonly FieldDef[]>(fields: F): F {
  return fields;
}

/**
 * The attribute defaults of a field list (every field with a `default`), as a
 * block definition's `defaults`.
 *
 * @param fields the block's fields
 */
export function fieldDefaults(fields: readonly FieldDef[]): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const field of fields) {
    if (field.default !== undefined) defaults[field.name] = field.default;
  }
  return defaults;
}
