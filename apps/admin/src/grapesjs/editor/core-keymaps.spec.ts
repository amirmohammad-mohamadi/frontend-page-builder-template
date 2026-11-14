import type { Editor } from "grapesjs";
import { CANVAS_SCOPED_KEYMAPS, isCanvasKeyEvent } from "./core-keymaps";

/** A node stand-in: `nodeType` marks it as a DOM node. */
const node = () => ({ nodeType: 1 });

/** A stub editor whose frames container contains exactly `inside`. */
const stubEditor = (inside: object) => {
  const runCommand = jest.fn();
  const editor = {
    Canvas: { getFramesEl: () => ({ contains: (target: unknown) => target === inside }) },
    runCommand,
  } as unknown as Editor;
  return { editor, runCommand };
};

/** A key event stand-in targeting `target`, with a spyable `preventDefault` on it and its parent. */
const keyEvent = (target: unknown) =>
  ({
    target,
    preventDefault: jest.fn(),
    _parentEvent: { preventDefault: jest.fn() },
  }) as unknown as Event & { _parentEvent: { preventDefault: jest.Mock } };

const runKeymap = (id: string, editor: Editor, event: Event) => {
  const handler = CANVAS_SCOPED_KEYMAPS?.[id]?.handler;
  if (typeof handler !== "function") throw new Error(`${id} has no function handler`);
  return handler(editor, undefined, { event });
};

describe("isCanvasKeyEvent", () => {
  it("is true only for events whose target sits inside the frames container", () => {
    const frame = node();
    const { editor } = stubEditor(frame);
    expect(isCanvasKeyEvent(editor, keyEvent(frame))).toBe(true);
    expect(isCanvasKeyEvent(editor, keyEvent(node()))).toBe(false);
  });

  it("is false without an event or with a non-node target such as window", () => {
    const { editor } = stubEditor(node());
    expect(isCanvasKeyEvent(editor)).toBe(false);
    expect(isCanvasKeyEvent(editor, keyEvent({}))).toBe(false);
  });
});

describe("CANVAS_SCOPED_KEYMAPS", () => {
  it("overrides exactly core's W/A/S/D and delete keymaps, with core's keys", () => {
    expect(
      Object.fromEntries(
        Object.entries(CANVAS_SCOPED_KEYMAPS ?? {}).map(([id, keymap]) => [id, keymap.keys])
      )
    ).toEqual({
      "core:component-next": "s",
      "core:component-prev": "w",
      "core:component-enter": "d",
      "core:component-exit": "a",
      "core:component-delete": "backspace, delete",
    });
  });

  it("turns off core's own prevent so keys outside the canvas are left alone", () => {
    Object.values(CANVAS_SCOPED_KEYMAPS ?? {}).forEach((keymap) =>
      expect(keymap.opts).toEqual({ prevent: false })
    );
  });

  it("runs the command for a key pressed in the canvas", () => {
    const frame = node();
    const { editor, runCommand } = stubEditor(frame);
    const event = keyEvent(frame);
    runKeymap("core:component-next", editor, event);
    expect(runCommand).toHaveBeenCalledWith("core:component-next", { event });
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores a key pressed anywhere in the shell", () => {
    const { editor, runCommand } = stubEditor(node());
    const event = keyEvent(node());
    runKeymap("core:component-delete", editor, event);
    expect(runCommand).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("cancels delete, and the frame's original event, only inside the canvas", () => {
    const frame = node();
    const { editor, runCommand } = stubEditor(frame);
    const event = keyEvent(frame);
    runKeymap("core:component-delete", editor, event);
    expect(runCommand).toHaveBeenCalledWith("core:component-delete", { event });
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event._parentEvent.preventDefault).toHaveBeenCalled();
  });
});
