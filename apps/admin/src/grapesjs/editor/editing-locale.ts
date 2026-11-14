import {
  CONTENT_LOCALES,
  DEFAULT_CONTENT_LOCALE,
  isContentLocale,
  type ContentLocale,
} from "@/config/locale";

/**
 * The locale the editor is editing: the one the translatable traits write and
 * the canvas renders. A module-level store, since GrapesJS trait views and the
 * canvas renderer live outside React; the shell's locale switcher writes it and
 * React reads it through `useSyncExternalStore` (`subscribeEditingLocale`).
 */
let editingLocale: ContentLocale = DEFAULT_CONTENT_LOCALE;
const listeners = new Set<() => void>();

/** The locale being edited. */
export function getEditingLocale(): ContentLocale {
  return editingLocale;
}

/** The locale a missing translation falls back to, in the traits and on the canvas. */
export function getDefaultContentLocale(): ContentLocale {
  return DEFAULT_CONTENT_LOCALE;
}

/**
 * Switches the editing locale and notifies every subscriber. An unknown locale is ignored.
 *
 * @param locale one of `CONTENT_LOCALES`
 */
export function setEditingLocale(locale: string): void {
  if (!isContentLocale(locale) || locale === editingLocale) return;
  editingLocale = locale;
  listeners.forEach((listener) => listener());
}

/** Calls `listener` after every locale switch; returns the unsubscribe. */
export function subscribeEditingLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The locales the switcher offers. */
export const EDITING_LOCALES: readonly ContentLocale[] = CONTENT_LOCALES;
