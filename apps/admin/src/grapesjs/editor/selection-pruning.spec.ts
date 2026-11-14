import grapesjs, { type Component, type Editor } from "grapesjs";
import { registerSelectionPruning } from "./selection-pruning";

/** Lets the pruning's microtask run. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("registerSelectionPruning", () => {
  let editor: Editor;

  /** Adds a block the way a tile click does (appended to the body, then selected). */
  const dropBlock = (
    content: object = {
      type: "default",
      tagName: "p",
      components: [{ type: "textnode", content: "Added" }],
    }
  ) => {
    const [added] = editor.getWrapper()!.append(content);
    editor.select(added);
    return added;
  };

  beforeEach(() => {
    // The shell's own setting (`core-config.ts`): selection is not an undo step.
    // No style sectors: core restyles the selection on a timer that may outlive the editor.
    editor = grapesjs.init({
      headless: true,
      storageManager: false,
      styleManager: { sectors: [] },
      undoManager: { trackSelection: false },
    });
    editor.setComponents([
      { type: "default", components: [{ type: "textnode", content: "Kept" }] },
    ]);
    editor.UndoManager.clear();
    registerSelectionPruning(editor);
  });

  afterEach(() => editor.destroy());

  it("deselects the block Undo takes off the page", async () => {
    const added = dropBlock();
    const deselected: Component[] = [];
    editor.on("component:deselected", (component: Component) => deselected.push(component));

    editor.UndoManager.undo();
    await settle();

    expect(added.parent()).toBeUndefined();
    expect(editor.getSelectedAll()).toEqual([]);
    expect(deselected).toEqual([added]);
  });

  it("adds no undo step, so Redo still puts the block back", async () => {
    dropBlock();
    editor.UndoManager.undo();
    await settle();

    expect(editor.UndoManager.hasRedo()).toBe(true);
    editor.UndoManager.redo();
    expect(editor.getWrapper()!.components().length).toBe(2);
  });

  it("deselects a block Redo removes again", async () => {
    const kept = editor.getWrapper()!.components().at(0);
    kept.remove();
    editor.UndoManager.undo();
    editor.select(kept);

    editor.UndoManager.redo();
    await settle();

    expect(editor.getSelectedAll()).toEqual([]);
  });

  it("keeps a selected block that is only moved", async () => {
    const wrapper = editor.getWrapper()!;
    const added = dropBlock();
    // A move takes the block out (temporarily) and puts it back elsewhere.
    wrapper.components().remove(added, { temporary: true } as never);
    wrapper.append(added, { at: 0 });
    await settle();

    expect(editor.getSelected()).toBe(added);
  });

  it("keeps the selection of a block still on the page", async () => {
    const kept = editor.getWrapper()!.components().at(0);
    dropBlock();
    editor.select(kept);
    editor.UndoManager.undo();
    await settle();

    expect(editor.getSelected()).toBe(kept);
  });
});
