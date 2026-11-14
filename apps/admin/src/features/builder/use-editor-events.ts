import type { Editor } from "grapesjs";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export type EditorEventStore<T> = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
};

/** Equal when `Object.is` says so, or when both are plain objects with `Object.is`-equal own keys. */
const shallowEqual = (a: unknown, b: unknown) => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) =>
    Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
};

/**
 * An external store over a GrapesJS editor's events, for `useSyncExternalStore`. `read` turns the
 * editor into a snapshot; however many of `events` fire, it is re-read at most once per animation
 * frame, and subscribers hear about it only when the snapshot changed (shallowly). Core fires
 * component, style and undo events on every keystroke, so this keeps React to one render a frame.
 *
 * @param editor the live editor
 * @param events space-separated editor events
 * @param read the snapshot of the editor
 */
export const createEditorEventStore = <T>(
  editor: Editor,
  events: string,
  read: () => T
): EditorEventStore<T> => {
  let snapshot = read();
  let frame = 0;
  const listeners = new Set<() => void>();

  const refresh = () => {
    frame = 0;
    const next = read();
    if (shallowEqual(next, snapshot)) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(refresh);
  };

  return {
    subscribe: (onChange) => {
      listeners.add(onChange);
      if (listeners.size === 1) {
        editor.on(events, schedule);
        // Catches anything that changed between the first read and this subscription.
        refresh();
      }
      return () => {
        listeners.delete(onChange);
        if (listeners.size) return;
        editor.off(events, schedule);
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };
    },
    getSnapshot: () => snapshot,
  };
};

/**
 * Reads editor state into React: re-renders when any of the space-separated `events` changes
 * what `select` returns, at most once per animation frame. Return primitives or a flat object of
 * primitives, since snapshots are compared shallowly. Returns `fallback` while there is no editor.
 *
 * @param editor the live editor, or `null` before it exists
 * @param events space-separated editor events
 * @param select the snapshot of the editor
 * @param fallback the value while there is no editor
 */
export const useEditorEvents = <T>(
  editor: Editor | null,
  events: string,
  select: (editor: Editor) => T,
  fallback: T
): T => {
  // `select` is usually an inline function; the store reads the latest one through a ref
  // instead of being rebuilt, and so re-subscribed, on every render.
  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  const fallbackRef = useRef(fallback);
  const store = useMemo<EditorEventStore<T>>(() => {
    if (!editor) {
      const value = fallbackRef.current;
      return { subscribe: () => () => undefined, getSnapshot: () => value };
    }
    return createEditorEventStore(editor, events, () => selectRef.current(editor));
  }, [editor, events]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};
