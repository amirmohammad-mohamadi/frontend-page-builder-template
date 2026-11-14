import type { Editor, SetOptions, Trait } from "grapesjs";
import { TEXTS } from "@/texts";

/** How a colour field reads and writes its component value. */
export type ColorFieldAccess = {
  read: () => unknown;
  /** Writes a value the UndoManager skips: a picker drag step, or a restore. */
  preview: (value: unknown) => void;
  /** Writes a value as one undo step. */
  commit: (value: unknown) => void;
};

/**
 * The write side of one colour field, apart from the DOM. Core's colour input writes in
 * synchronous bursts: one `avoidStore` value per picker drag step, and on commit the sentinels
 * `0` and `""` around the colour so the UndoManager sees a change. It also re-sends that commit
 * burst on every `component:selected`, from every colour input ever rendered for the field (core
 * never removes a deselected component's trait views), even when nothing was picked. Each burst
 * is collapsed into its last value and written once, after the burst: a commit that differs from
 * the committed colour becomes one undo step, anything else is only previewed.
 *
 * @param field the field's read/preview/commit access
 * @param schedule how a flush is deferred (a microtask by default; tests pass their own)
 */
export function createColorWriteBuffer(
  field: ColorFieldAccess,
  schedule: (flush: () => void) => void = queueMicrotask
) {
  let committed = field.read();
  let pending: { value: unknown; final: boolean } | undefined;
  let previewing = false;

  const preview = (value: unknown) => {
    if (field.read() === value) return;
    previewing = true;
    try {
      field.preview(value);
    } finally {
      previewing = false;
    }
  };

  const flush = () => {
    if (!pending) return;
    const { value, final } = pending;
    pending = undefined;
    if (!final || value === committed) {
      preview(value);
      return;
    }
    // Back to the committed colour first, so the undo step is a real change even when the
    // drag already previewed the value being committed.
    preview(committed);
    committed = value;
    field.commit(value);
  };

  return {
    /** Queues a value the input sent: `final` for a commit, false for a picker drag step. */
    push(value: unknown, final: boolean): void {
      if (!pending) schedule(flush);
      pending = { value, final: final || !!pending?.final };
    },
    /** Takes the component's value as committed when it changed outside a preview (undo, redo). */
    sync(value: unknown): void {
      if (!previewing) committed = value;
    },
  };
}

/**
 * Reads and writes a colour trait. Previews go straight to the attribute with `avoidStore`:
 * core's own partial trait write would also leave an `__p: null` key in the attributes, which
 * `getProjectData()` saves. A trait with its own `setValue` is left to that setter.
 */
function colorFieldAccess(trait: Trait): ColorFieldAccess {
  const ownSetter = !!trait.get("setValue") || trait.changeProp;
  return {
    read: () => trait.getValue(),
    preview: (value) =>
      ownSetter
        ? trait.setValue(value, { partial: true })
        : trait.component.addAttributes({ [trait.getName()]: value }, { avoidStore: true }),
    commit: (value) => trait.setValue(value),
  };
}

/** The hint a colour field shows while it refuses a typed value. */
export const INVALID_COLOR_HINT = TEXTS.builder.traits.invalidColor;

/** Whether the browser reads `value` as a CSS colour. */
const isCssColor = (value: string) =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("color", value);

/**
 * Refuses a typed value that is not a colour. Core's colour input runs every typed value through
 * its picker, which turns one it cannot read into black and saves that, so a typo silently became
 * `#000000`. This runs first, on the text box itself: the value goes back to the field's current
 * one, nothing is written, and the box is marked invalid with a hint until a colour is typed.
 * An empty value still clears the field.
 *
 * @param input the colour field's text box
 * @param readValue the field's current value
 * @param isColor whether a value is a colour (the browser's own test by default)
 */
export function guardColorInput(
  input: HTMLInputElement,
  readValue: () => unknown,
  isColor: (value: string) => boolean = isCssColor
): void {
  input.addEventListener(
    "change",
    (event) => {
      const value = input.value.trim();
      if (!value || isColor(value)) {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("title");
        return;
      }
      event.stopImmediatePropagation();
      const current = readValue();
      input.value = typeof current === "string" ? current : "";
      input.setAttribute("aria-invalid", "true");
      input.title = INVALID_COLOR_HINT;
    },
    true
  );
}

/**
 * Replaces core's `color` trait view with one that routes its input's writes through
 * `createColorWriteBuffer`, so deselecting a component no longer pushes a fused group of
 * attribute changes onto the undo stack, and refuses a typed value that is not a colour
 * (`guardColorInput`). Core's picker and swatch are kept as they are. The Studio SDK draws its
 * own colour field and never uses this view.
 *
 * @param editor the editor whose `color` view is replaced
 */
export function registerColorTraitType(editor: Editor): void {
  const CoreColorView = editor.TraitManager.getType("color");

  class ColorTraitView extends CoreColorView {
    private readonly writes = createColorWriteBuffer(colorFieldAccess(this.model));
    private guarded = false;

    override getInputEl() {
      const el = super.getInputEl();
      const text = el?.querySelector("input");
      if (text && !this.guarded) {
        this.guarded = true;
        guardColorInput(text, () => this.model.getValue());
      }
      return el;
    }

    override onValueChange(
      trait: Trait,
      value: string,
      opts: SetOptions & { fromTarget?: boolean } = {}
    ) {
      if (opts.fromTarget) {
        this.writes.sync(value);
        super.onValueChange(trait, value, opts);
        return;
      }
      this.writes.push(value, !opts.avoidStore);
    }
  }

  editor.TraitManager.types.color = ColorTraitView;
}
