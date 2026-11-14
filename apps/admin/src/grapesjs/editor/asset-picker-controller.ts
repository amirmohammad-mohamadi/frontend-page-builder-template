import type { Asset, AssetsCustomData } from "grapesjs";

/** Media kinds the picker can hand back. */
export type AssetPickerMediaType = "image" | "video";

/**
 * The media kinds a request accepts, from the `types` core passes on open (`['image']` for a
 * core image, the trait's `accept` for a file field). Unknown or empty `types` accept both.
 *
 * @param types the kinds core named on open
 */
export const toAcceptedTypes = (types: readonly string[]): AssetPickerMediaType[] => {
  const known = (["image", "video"] as const).filter((type) => types.includes(type));
  return known.length > 0 ? known : ["image", "video"];
};

/** One media-library item handed back to the Asset Manager caller. */
export type AssetPick = {
  src: string;
  name: string;
  type: string;
};

/** What core hands the picker on open (`types`, `select`, `close`, `options`), numbered per open. */
export type AssetPickerRequest = AssetsCustomData & {
  /** Increments on every open, so a picker can reset its state for each request. */
  openId: number;
};

/** Hooks the Asset Manager calls instead of opening core's own modal (`assetManager.custom`). */
export type CoreAssetPickerHooks = {
  open: (props: AssetsCustomData) => void;
  close: (props: AssetsCustomData) => void;
};

/**
 * The Asset Manager's `assetManager.custom` hooks plus a store a React picker subscribes to:
 * `open` publishes the request core hands over, `close` clears it. Pass it as
 * `getCoreEditorConfig({ assetPicker })`.
 */
export type AssetPickerController = CoreAssetPickerHooks & {
  /** The open request, or `null` while the picker is closed. */
  getSnapshot: () => AssetPickerRequest | null;
  /** Calls `listener` after every open and close; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
};

/** Creates the store behind one editor's media picker. */
export const createAssetPickerController = (): AssetPickerController => {
  let request: AssetPickerRequest | null = null;
  let openCount = 0;
  const listeners = new Set<() => void>();
  const publish = (next: AssetPickerRequest | null) => {
    request = next;
    listeners.forEach((listener) => listener());
  };

  return {
    open: (props: AssetsCustomData) => publish({ ...props, openId: ++openCount }),
    close: () => publish(null),
    getSnapshot: () => request,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/**
 * Hands a pick back to whoever opened the Asset Manager, then closes it.
 *
 * The caller's own `options.select` gets a detached asset (`src`, plus `getSrc()` for core's
 * image component), so the pick is never added to the Asset Manager and never grows the
 * project's `assets` array. Core's `select` wrapper, which calls `am.add` first, is only the
 * fallback for a caller that passed no `select` of its own.
 *
 * @param request the open request
 * @param pick the chosen media item
 */
export const resolveAssetPick = (request: AssetsCustomData, pick: AssetPick) => {
  const callerSelect = request.options?.select;
  if (typeof callerSelect === "function") {
    // Callers only read `getSrc()` (core image) or `src` (custom-trait fields).
    const detached = { ...pick, getSrc: () => pick.src } as unknown as Asset;
    callerSelect(detached, true);
  } else {
    request.select(pick as unknown as Asset, true);
  }
  request.close();
};
