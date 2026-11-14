import type { Editor } from "grapesjs";
import type { FileAccept } from "@components/builder";
import { TEXTS } from "@/texts";

/**
 * Plain-DOM helpers for the hand-built trait views (`file`, `translatable`). GrapesJS trait
 * views are Backbone views, not React, so these build real elements; the `.pb-trait-*`
 * classes are styled by the shell's `theme.css`.
 */

/** Opens the editor's Asset Manager and resolves with the picked asset's URL. */
function pickAsset(editor: Editor, types: string[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    editor.AssetManager.open({
      types,
      select: (asset: { getSrc?: () => string; src?: string }, complete: boolean) => {
        const src = asset.getSrc ? asset.getSrc() : asset.src;
        if (complete !== false) {
          editor.AssetManager.close();
          resolve(src);
        }
      },
    } as never);
  });
}

/**
 * Builds a file field's thumbnail + URL input + "Browse…" row. Browse opens the Asset Manager
 * filtered to the `accept` kinds (images when omitted); `onCommit` runs after a pick and once
 * a typed URL is committed (Enter or blur).
 *
 * @param editor the editor whose Asset Manager Browse opens
 * @param opts the current value, the accepted kinds and the commit callback
 */
export function buildFileInput(
  editor: Editor,
  opts: { value: string; accept?: FileAccept; onCommit: (value: string) => void }
): { el: HTMLElement; setValue: (value: string) => void } {
  const row = document.createElement("div");
  row.className = "pb-trait-file";
  const thumb = document.createElement("div");
  thumb.className = "pb-trait-file-thumb";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = TEXTS.builder.traits.filePlaceholder;
  input.className = "pb-trait-input";

  const syncThumb = () => {
    thumb.style.backgroundImage = input.value ? `url("${input.value}")` : "";
  };
  const setValue = (value: string) => {
    input.value = value;
    syncThumb();
  };
  setValue(opts.value);
  input.addEventListener("input", syncThumb);
  input.addEventListener("change", () => opts.onCommit(input.value.trim()));

  const browse = document.createElement("button");
  browse.type = "button";
  browse.className = "pb-trait-button";
  browse.textContent = TEXTS.builder.traits.browse;
  browse.addEventListener("click", async () => {
    const src = await pickAsset(editor, opts.accept ? opts.accept.split(",") : ["image"]);
    if (src) {
      setValue(src);
      opts.onCommit(src);
    }
  });

  row.append(thumb, input, browse);
  return { el: row, setValue };
}
