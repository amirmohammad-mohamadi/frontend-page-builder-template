import { createColorWriteBuffer, guardColorInput, INVALID_COLOR_HINT } from "./color-trait";

/**
 * One colour attribute, recording every write with whether the UndoManager would store it, and
 * a buffer whose flushes run when `settle` is called. Every attribute change is reported back
 * through `sync`, as core's `targetUpdated` does for the view.
 */
const colorField = (initial: string) => {
  let attribute: unknown = initial;
  const writes: { value: unknown; stored: boolean }[] = [];
  const setAttribute = (value: unknown) => {
    attribute = value;
    buffer.sync(value);
  };
  const write = (stored: boolean) => (value: unknown) => {
    writes.push({ value, stored });
    setAttribute(value);
  };
  const queued: (() => void)[] = [];
  const buffer = createColorWriteBuffer(
    { read: () => attribute, preview: write(false), commit: write(true) },
    (flush) => queued.push(flush)
  );
  const settle = () => queued.splice(0).forEach((flush) => flush());
  return { buffer, writes, settle, setAttribute, read: () => attribute };
};

/** What core's colour input sends to commit `value`: sentinel `0`, the value, `""`, the value. */
const commit = (buffer: ReturnType<typeof createColorWriteBuffer>, value: string) => {
  buffer.push(0, false);
  buffer.push(value, false);
  buffer.push("", true);
  buffer.push(value, true);
};

describe("createColorWriteBuffer", () => {
  it("writes nothing when a deselect re-sends the committed colour", () => {
    const { buffer, writes, settle } = colorField("#0a0a0f");
    commit(buffer, "#0a0a0f");
    commit(buffer, "#0a0a0f");
    settle();
    expect(writes).toEqual([]);
  });

  it("stores a picked colour as one write", () => {
    const { buffer, writes, settle, read } = colorField("#0a0a0f");
    commit(buffer, "#ff0000");
    settle();
    expect(writes).toEqual([{ value: "#ff0000", stored: true }]);
    expect(read()).toBe("#ff0000");
  });

  it("previews drag steps unstored and stores the colour the drag ends on as a change", () => {
    const { buffer, writes, settle } = colorField("#0a0a0f");
    buffer.push("#111111", false);
    settle();
    buffer.push("#222222", false);
    settle();
    commit(buffer, "#222222");
    settle();
    expect(writes).toEqual([
      { value: "#111111", stored: false },
      { value: "#222222", stored: false },
      { value: "#0a0a0f", stored: false },
      { value: "#222222", stored: true },
    ]);
  });

  it("restores the committed colour unstored when a drag is cancelled", () => {
    const { buffer, writes, settle, read } = colorField("#0a0a0f");
    buffer.push("#222222", false);
    settle();
    buffer.push("#0a0a0f", false);
    settle();
    commit(buffer, "#0a0a0f");
    settle();
    expect(writes).toEqual([
      { value: "#222222", stored: false },
      { value: "#0a0a0f", stored: false },
    ]);
    expect(read()).toBe("#0a0a0f");
  });

  it("stores a colour cleared by typing", () => {
    const { buffer, writes, settle } = colorField("#0a0a0f");
    buffer.push("", true);
    settle();
    expect(writes).toEqual([{ value: "", stored: true }]);
  });

  it("takes a value restored by undo as committed", () => {
    const { buffer, writes, settle, setAttribute } = colorField("#0a0a0f");
    commit(buffer, "#ff0000");
    settle();
    setAttribute("#0a0a0f");
    commit(buffer, "#0a0a0f");
    settle();
    expect(writes).toEqual([{ value: "#ff0000", stored: true }]);
  });
});

describe("guardColorInput", () => {
  /** A text box with just what the guard uses, and the listener core's input would add after it. */
  const textBox = (value: string) => {
    const listeners: ((event: { stopImmediatePropagation: () => void }) => void)[] = [];
    const attributes = new Map<string, string>();
    const input = {
      value,
      title: "",
      addEventListener: (_type: string, listener: (typeof listeners)[number]) =>
        listeners.push(listener),
      setAttribute: (name: string, v: string) => attributes.set(name, v),
      removeAttribute: (name: string) => attributes.delete(name),
    };
    const change = () => {
      let stopped = false;
      listeners.forEach((listener) =>
        listener({ stopImmediatePropagation: () => (stopped = true) })
      );
      return stopped;
    };
    return { input, attributes, change };
  };
  const isColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value) || value === "teal";

  it("refuses a value that is not a colour: nothing written, the field's value back, marked invalid", () => {
    const { input, attributes, change } = textBox("");
    guardColorInput(input as unknown as HTMLInputElement, () => "#7c3aed", isColor);
    input.value = "notacolor";

    expect(change()).toBe(true);
    expect(input.value).toBe("#7c3aed");
    expect(attributes.get("aria-invalid")).toBe("true");
    expect(input.title).toBe(INVALID_COLOR_HINT);
  });

  it("lets a colour, or an empty value, through and clears the mark", () => {
    const { input, attributes, change } = textBox("");
    guardColorInput(input as unknown as HTMLInputElement, () => "", isColor);
    input.value = "bad";
    change();
    input.value = "teal";

    expect(change()).toBe(false);
    expect(attributes.has("aria-invalid")).toBe(false);
    input.value = "";
    expect(change()).toBe(false);
  });
});
