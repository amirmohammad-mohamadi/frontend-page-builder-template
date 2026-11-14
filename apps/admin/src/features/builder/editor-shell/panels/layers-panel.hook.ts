import type { Component, Editor } from "grapesjs";
import { useEffect } from "react";
import { TEXTS } from "@/texts";

type Props = {
  /** The live core editor; `null` until the shell has created it. */
  editor: Editor | null;
};

// Core's layer row markup under the default `gjs-` prefix (grapesjs 0.22.16 navigator ItemView).
const ROW_RIGHT_SELECTOR = ":scope > .gjs-layer-item .gjs-layer-item-right";
const LOCK_ATTRIBUTE = "data-layer-lock";
const LOCKED_ROW_CLASS = "builder-layer--locked";
const LOCK_EVENTS = "component:update:locked";

// Lucide's `lock` and `lock-open` glyphs, drawn like core's own row icons (inline SVG).
const LOCK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const UNLOCK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

type LayerView = { el?: HTMLElement };

/** The layer element core rendered for `component`, if its row is in the tree. */
function getLayerEl(component: Component) {
  return (component as Component & { viewLayer?: LayerView }).viewLayer?.el;
}

/** Writes a row's lock button and locked class from the component's `locked` flag. */
function syncLock(editor: Editor, component: Component, layerEl: HTMLElement) {
  const locked = editor.Layers.isLocked(component);
  layerEl.classList.toggle(LOCKED_ROW_CLASS, locked);
  const button = layerEl.querySelector<HTMLButtonElement>(
    `${ROW_RIGHT_SELECTOR} [${LOCK_ATTRIBUTE}]`
  );
  if (!button) return;
  const label = locked ? TEXTS.builder.shell.layerUnlock : TEXTS.builder.shell.layerLock;
  button.setAttribute("aria-pressed", String(locked));
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = locked ? LOCK_ICON : UNLOCK_ICON;
}

/**
 * Adds a lock toggle to a layer row (core's LayerManager has the API but no control for it) and
 * syncs it. Core rebuilds a row's markup on every render, so this runs again on `layer:render`.
 */
function addLockToggle(editor: Editor, component: Component, layerEl: HTMLElement) {
  const right = layerEl.querySelector<HTMLElement>(ROW_RIGHT_SELECTOR);
  if (!right) return;
  if (!right.querySelector(`[${LOCK_ATTRIBUTE}]`)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "builder-layer-lock";
    button.setAttribute(LOCK_ATTRIBUTE, "");
    // The row selects its component on click; toggling the lock must not. Unlocking clears the
    // flag instead of storing `locked: false`, so an unlocked layer serialises as before.
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (editor.Layers.isLocked(component)) component.unset("locked");
      else editor.Layers.setLocked(component, true);
    });
    right.prepend(button);
  }
  syncLock(editor, component, layerEl);
}

/**
 * Drives the Layers tab around core's default LayersView: expanding, selecting, hovering,
 * renaming (double-click), hiding and drag reordering stay core's; this adds the lock toggle
 * to every row, including rows rendered before the hook subscribed.
 */
export const useLayersPanel = ({ editor }: Props) => {
  useEffect(() => {
    if (!editor) return;

    const onRender = ({ component, el }: { component: Component; el: HTMLElement }) =>
      addLockToggle(editor, component, el);
    const onLocked = (component: Component) => {
      const layerEl = getLayerEl(component);
      if (layerEl) syncLock(editor, component, layerEl);
    };

    const wrapper = editor.getWrapper();
    const sweep = (component: Component) => {
      const layerEl = getLayerEl(component);
      if (layerEl) addLockToggle(editor, component, layerEl);
      component.components().forEach(sweep);
    };
    if (wrapper) sweep(wrapper);

    editor.on("layer:render", onRender);
    editor.on(LOCK_EVENTS, onLocked);
    return () => {
      editor.off("layer:render", onRender);
      editor.off(LOCK_EVENTS, onLocked);
    };
  }, [editor]);
};
