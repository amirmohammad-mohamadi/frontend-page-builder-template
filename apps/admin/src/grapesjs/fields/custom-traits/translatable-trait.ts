import type { Editor } from "grapesjs";
import {
  parseTranslatable,
  resolveTranslatable,
  RICH_TEXT_TAGS,
  sanitizeHtml,
  setTranslation,
} from "@components/builder";
import {
  getDefaultContentLocale,
  getEditingLocale,
  subscribeEditingLocale,
} from "../../editor/editing-locale";
import type { BuilderTraitDefinition, TranslatableVariant } from "../types";
import { TEXTS } from "@/texts";

/**
 * The text stored for exactly `locale` in a translatable attribute (`""` when that locale has
 * none), unlike `resolveTranslatable`, which falls back: the field must show an empty box for
 * a locale that is not translated yet.
 *
 * @param raw the stored attribute value
 * @param locale the locale being edited
 * @param defaultLocale the locale a plain-string value is in
 */
export function localeText(raw: unknown, locale: string, defaultLocale: string): string {
  return parseTranslatable(raw, defaultLocale)[locale] ?? "";
}

/**
 * The text the field shows as a placeholder while `locale` has no translation: what the page
 * falls back to (the default locale's text, else any text there is).
 *
 * @param raw the stored attribute value
 * @param locale the locale being edited
 * @param defaultLocale the locale a missing translation falls back to
 */
export function fallbackText(raw: unknown, locale: string, defaultLocale: string): string {
  return localeText(raw, locale, defaultLocale)
    ? ""
    : resolveTranslatable(raw, locale, defaultLocale);
}

/**
 * The stored value with `locale`'s text replaced by `text`; rich text is reduced to the
 * rich-text allow-list first, so what the editor writes is what the page renders.
 *
 * @param raw the stored attribute value
 * @param locale the locale being edited
 * @param text the new text (HTML for `richtext`)
 * @param defaultLocale the locale a plain-string value is in
 * @param variant the field's editor kind
 */
export function writeLocaleText(
  raw: unknown,
  locale: string,
  text: string,
  defaultLocale: string,
  variant: TranslatableVariant = "text"
): string {
  const clean = variant === "richtext" ? sanitizeHtml(text, RICH_TEXT_TAGS) : text;
  return setTranslation(raw, locale, clean, defaultLocale);
}

/** The rich-text toolbar: label, `execCommand` name and an optional prompt for its argument. */
const RICH_TEXT_ACTIONS: readonly { label: string; title: string; command: string }[] = [
  { label: "B", title: TEXTS.builder.traits.bold, command: "bold" },
  { label: "I", title: TEXTS.builder.traits.italic, command: "italic" },
  { label: "Link", title: TEXTS.builder.traits.link, command: "createLink" },
  { label: "List", title: TEXTS.builder.traits.bulletList, command: "insertUnorderedList" },
];

type FieldAccess = {
  read: () => unknown;
  write: (value: string) => void;
};

/**
 * Builds the editor of one translatable field: an input, a textarea or a formatted-text box
 * with a small toolbar, bound to the current editing locale. `refresh` re-reads the stored
 * value and the editing locale into the box.
 *
 * @param variant which box to draw
 * @param access how to read and write the stored attribute
 * @param placeholder the field's own placeholder, shown when there is no fallback text either
 */
export function buildTranslatableField(
  variant: TranslatableVariant,
  access: FieldAccess,
  placeholder = ""
): { el: HTMLElement; refresh: () => void } {
  const container = document.createElement("div");
  container.className = `pb-trait pb-trait-translatable pb-trait-translatable--${variant}`;

  const badge = document.createElement("span");
  badge.className = "pb-trait-locale";
  container.appendChild(badge);

  const commit = (text: string) => {
    const locale = getEditingLocale();
    const defaultLocale = getDefaultContentLocale();
    const next = writeLocaleText(access.read(), locale, text, defaultLocale, variant);
    if (next !== String(access.read() ?? "")) access.write(next);
  };

  if (variant === "richtext") {
    const toolbar = document.createElement("div");
    toolbar.className = "pb-trait-toolbar";
    toolbar.setAttribute("role", "toolbar");
    const box = document.createElement("div");
    box.className = "pb-trait-richtext";
    box.contentEditable = "true";
    box.dir = "auto";
    box.setAttribute("role", "textbox");
    box.setAttribute("aria-multiline", "true");

    RICH_TEXT_ACTIONS.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pb-trait-button";
      button.textContent = action.label;
      button.title = action.title;
      button.setAttribute("aria-label", action.title);
      // mousedown is cancelled so the box keeps its selection while the command runs.
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        box.focus();
        if (action.command === "createLink") {
          const href = window.prompt(TEXTS.builder.traits.linkPrompt, "https://");
          if (!href) return;
          document.execCommand(action.command, false, href);
        } else {
          document.execCommand(action.command, false);
        }
        commit(box.innerHTML);
      });
      toolbar.appendChild(button);
    });

    box.addEventListener("blur", () => commit(box.innerHTML));
    box.addEventListener("input", () => commit(box.innerHTML));
    container.append(toolbar, box);

    const refresh = () => {
      const locale = getEditingLocale();
      const defaultLocale = getDefaultContentLocale();
      const raw = access.read();
      badge.textContent = locale;
      const html = sanitizeHtml(localeText(raw, locale, defaultLocale), RICH_TEXT_TAGS);
      if (box.innerHTML !== html && document.activeElement !== box) box.innerHTML = html;
      box.dataset.placeholder =
        fallbackText(raw, locale, defaultLocale)
          .replace(/<[^>]+>/g, "")
          .trim()
          .slice(0, 120) || placeholder;
    };
    refresh();
    return { el: container, refresh };
  }

  const input =
    variant === "textarea" ? document.createElement("textarea") : document.createElement("input");
  if (input instanceof HTMLTextAreaElement) input.rows = 3;
  else input.type = "text";
  input.className = "pb-trait-input";
  input.dir = "auto";
  input.addEventListener("change", () => commit(input.value));
  container.appendChild(input);

  const refresh = () => {
    const locale = getEditingLocale();
    const defaultLocale = getDefaultContentLocale();
    const raw = access.read();
    badge.textContent = locale;
    const text = localeText(raw, locale, defaultLocale);
    if (input.value !== text && document.activeElement !== input) input.value = text;
    input.placeholder = fallbackText(raw, locale, defaultLocale) || placeholder;
  };
  refresh();
  return { el: container, refresh };
}

/**
 * Re-syncs each rendered field from its trait and the editing locale. Keyed by the field's
 * element, which core caches on the trait model and reuses on every re-selection.
 */
const refreshers = new WeakMap<HTMLElement, () => void>();

/** Every live field, re-read when the editing locale switches; pruned once detached. */
const live = new Set<HTMLElement>();
let subscribed = false;

function watchLocale(): void {
  if (subscribed) return;
  subscribed = true;
  subscribeEditingLocale(() => {
    live.forEach((el) => {
      if (!el.isConnected) {
        live.delete(el);
        return;
      }
      refreshers.get(el)?.();
    });
  });
}

/**
 * Registers the `translatable` trait type: edits the current editing locale's text inside the
 * attribute's locale record (`{"en":"…","fa":"…"}`), as a one-line input, a textarea or a
 * formatted-text box (bold, italic, link, list), with the fallback text as the placeholder.
 * Switching the editing locale re-reads every rendered field.
 *
 * @param editor the editor to register the type on
 */
export function registerTranslatableTraitType(editor: Editor): void {
  editor.TraitManager.addType("translatable", {
    // The field writes through `trait.setValue` itself; no core `.gjs-field` wrapper.
    eventCapture: [],
    templateInput: () => "",
    createInput({ trait }) {
      const definition = trait.attributes as BuilderTraitDefinition;
      const field = buildTranslatableField(
        definition.variant ?? "text",
        {
          read: () => trait.getValue(),
          write: (value) => trait.setValue(value),
        },
        definition.placeholder ?? ""
      );
      refreshers.set(field.el, field.refresh);
      live.add(field.el);
      watchLocale();
      return field.el;
    },
    onUpdate({ elInput }) {
      refreshers.get(elInput)?.();
    },
  });
}
