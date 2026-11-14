import type { Editor } from "grapesjs";
import { createEditorEventStore } from "./use-editor-events";

/** A stub editor with a real `on`/`off`/`trigger` event map. */
const stubEditor = () => {
  const handlers = new Map<string, Set<() => void>>();
  const editor = {
    on: jest.fn((events: string, handler: () => void) => {
      events.split(" ").forEach((event) => {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)?.add(handler);
      });
    }),
    off: jest.fn((events: string, handler: () => void) => {
      events.split(" ").forEach((event) => handlers.get(event)?.delete(handler));
    }),
  };
  const trigger = (event: string) => handlers.get(event)?.forEach((handler) => handler());
  const listenerCount = () => [...handlers.values()].reduce((sum, set) => sum + set.size, 0);
  return { editor: editor as unknown as Editor, trigger, listenerCount };
};

describe("createEditorEventStore", () => {
  let frames: (() => void)[];

  beforeEach(() => {
    frames = [];
    global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      frames.push(() => callback(0));
      return frames.length;
    });
    global.cancelAnimationFrame = jest.fn();
  });

  const flushFrame = () => frames.splice(0).forEach((run) => run());

  it("re-reads once per animation frame however many events fire", () => {
    const { editor, trigger } = stubEditor();
    let value = 0;
    const read = jest.fn(() => ({ value }));
    const store = createEditorEventStore(editor, "update undo", read);
    const onChange = jest.fn();
    store.subscribe(onChange);
    read.mockClear();

    value = 1;
    trigger("update");
    trigger("undo");
    trigger("update");
    expect(read).not.toHaveBeenCalled();

    flushFrame();
    expect(read).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ value: 1 });
  });

  it("keeps the same snapshot and stays quiet when nothing changed shallowly", () => {
    const { editor, trigger } = stubEditor();
    const store = createEditorEventStore(editor, "update", () => ({ a: 1, b: "x" }));
    const first = store.getSnapshot();
    const onChange = jest.fn();
    store.subscribe(onChange);

    trigger("update");
    flushFrame();
    expect(onChange).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(first);
  });

  it("catches a change made between the first read and the subscription", () => {
    const { editor } = stubEditor();
    let value = "a";
    const store = createEditorEventStore(editor, "update", () => value);
    value = "b";
    store.subscribe(jest.fn());
    expect(store.getSnapshot()).toBe("b");
  });

  it("listens once for many subscribers and stops, cancelling a pending frame, after the last", () => {
    const { editor, trigger, listenerCount } = stubEditor();
    const store = createEditorEventStore(editor, "update undo", () => 0);
    const first = store.subscribe(jest.fn());
    const second = store.subscribe(jest.fn());
    expect(editor.on).toHaveBeenCalledTimes(1);
    expect(listenerCount()).toBe(2);

    first();
    expect(listenerCount()).toBe(2);
    trigger("update");
    second();
    expect(listenerCount()).toBe(0);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
