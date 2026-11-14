import type { Component, Editor } from "grapesjs";

/** Whether `component` sits in the tree of `wrapper` (the page's body), the body itself included. */
function isInTree(component: Component, wrapper: Component | undefined): boolean {
  let top = component;
  for (let parent = top.parent(); parent; parent = parent.parent()) top = parent;
  return !!wrapper && top === wrapper;
}

/**
 * Deselects every selected component that has left the page: Undo and Redo
 * take a block out with core's `fromUndo`, which skips the deselect the
 * Delete command does, so the Properties tab kept editing the removed block.
 * Checked after the removal has finished (a microtask later), so a block that
 * is only being moved, or put back by the same Undo, stays selected. The
 * deselect adds no undo step.
 *
 * @param editor the builder's GrapesJS editor
 */
export function registerSelectionPruning(editor: Editor): void {
  let queued = false;

  const prune = () => {
    queued = false;
    // Destroying the editor removes every block too; nothing is left to deselect.
    if (editor.em.destroyed) return;
    const wrapper = editor.getWrapper();
    const stale = editor.getSelectedAll().filter((component) => !isInTree(component, wrapper));
    if (stale.length) editor.em.removeSelected(stale, { avoidStore: true });
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(prune);
  };

  const events = "component:removed undo redo";
  editor.on(events, schedule);
  editor.on("destroy", () => editor.off(events, schedule));
}
