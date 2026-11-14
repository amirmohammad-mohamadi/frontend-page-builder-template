import type { CommandFunction, Editor, KeymapsConfig } from "grapesjs";

/**
 * Core's single-key selection keymaps (grapesjs 0.22.16 defaults), by the command each runs.
 * Undo, redo, copy and paste keep core's defaults.
 */
const CANVAS_ONLY_KEYS = {
  "core:component-next": "s",
  "core:component-prev": "w",
  "core:component-enter": "d",
  "core:component-exit": "a",
  "core:component-delete": "backspace, delete",
} as const;

type KeyEvent = Event & { _parentEvent?: Event };

/**
 * Whether a keymap's key event came from inside the canvas. Core re-dispatches every key event
 * of a canvas frame on that frame's element in the host document, so the event targets an
 * element inside the frames container; anything else was typed in the host page.
 *
 * @param editor the editor whose canvas is checked
 * @param event the key event core handed the keymap
 */
export const isCanvasKeyEvent = (editor: Editor, event?: Event) => {
  const target = event?.target as Node | null | undefined;
  if (!target || typeof target.nodeType !== "number") return false;
  return !!editor.Canvas.getFramesEl()?.contains(target);
};

/** Runs `command` for a key pressed inside the canvas, and ignores it anywhere else. */
const canvasOnly =
  (command: string, prevent: boolean): CommandFunction =>
  (editor, _sender, options: { event?: KeyEvent } = {}) => {
    const { event } = options;
    if (!isCanvasKeyEvent(editor, event)) return;
    if (prevent) {
      event?.preventDefault();
      event?._parentEvent?.preventDefault();
    }
    return editor.runCommand(command, options);
  };

/**
 * `keymaps.defaults` for the core shell. Core skips a keymap while any host element other than
 * the page body has focus, so W/A/S/D and Delete would still move or delete the selected
 * component whenever focus falls back to the body (after a click on Layers or an empty part of
 * the shell). These run only for keys pressed inside the canvas. Core merges this over its
 * defaults.
 */
export const CANVAS_SCOPED_KEYMAPS: KeymapsConfig["defaults"] = Object.fromEntries(
  Object.entries(CANVAS_ONLY_KEYS).map(([command, keys]) => {
    const prevent = command === "core:component-delete";
    // `prevent: false` replaces core's `prevent: true` on delete, which cancels the key before
    // the handler runs; the handler cancels it itself, inside the canvas only.
    return [command, { keys, handler: canvasOnly(command, prevent), opts: { prevent: false } }];
  })
);
