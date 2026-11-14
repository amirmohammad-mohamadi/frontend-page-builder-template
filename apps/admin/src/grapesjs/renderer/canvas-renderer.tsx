import type { Component, ComponentView, CustomRendererProps, Editor, Frame } from "grapesjs";
import type { QueryClient } from "@tanstack/react-query";
import React, {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import type { BlockProps } from "@components/builder";
import { QueryClientProvider } from "@services";
import {
  getDefaultContentLocale,
  getEditingLocale,
  subscribeEditingLocale,
} from "../editor/editing-locale";
import type { CanvasRendererComponent, CanvasRendererConfig } from "./index";

/**
 * React canvas renderer for the GrapesJS page builder.
 *
 * GrapesJS core exposes `CanvasConfig.customRenderer`, called once per canvas frame load from
 * `FrameView.renderBody` with `{ editor, frame, window, frameView, onMount }`. This module mounts
 * a single React root on that frame's `<body>` and renders the whole component tree from the
 * models, so every block is drawn by the same React component the web app renders it with.
 *
 * Two rules hold the design together:
 *
 * 1. **One React root per frame**, with GrapesJS children passed down as React children, so a
 *    container block receives its child blocks exactly as the web renderer hands them over.
 * 2. **React owns the element tree, GrapesJS owns the element itself.** React decides which
 *    elements exist and what a block component is handed, and renders no attributes at all on
 *    the elements it binds. Each of those elements is attached to a real `ComponentView`, which
 *    writes `id` / `data-gjs-type` / `draggable`, the classes, the inline style and the
 *    selection status exactly as core always did, and registers the element in the lookup
 *    channels the editor resolves clicks and drags through (`el.__gjsv`, cash `data('model')`).
 *    Only the view's DOM-building methods are neutralised.
 */

export type { CanvasRendererComponent, CanvasRendererConfig } from "./index";

/** Everything a node needs from the frame it is being rendered into. */
type CanvasRendererContextValue = {
  editor: Editor;
  frameView: CustomRendererProps["frameView"];
  config: CanvasRendererConfig;
};

const CanvasRendererContext = React.createContext<CanvasRendererContextValue | null>(null);

/** HTML elements that must not be given children (React throws if they are). */
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * Model events that change what React renders for a node. `rte:disable` is in the list because
 * `ComponentTextView.disableEditing` skips the model write when the text came back unchanged, and
 * the canvas still has to be resynchronised with the model after a `contenteditable` session.
 */
const NODE_EVENTS =
  "change:attributes change:content change:style change:type change:tagName change:components rerender rte:disable";

/** Backbone collection events on a node's children that change the rendered subtree. */
const CHILDREN_EVENTS = "add remove reset sort";

/** Class-collection events: the bound view rewrites the element's classes. */
const CLASS_EVENTS = "add remove reset change";

/* --------------------------------- Helpers --------------------------------- */

/** Escapes the three characters that would otherwise be read as markup. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** `backgroundColor` -> `background-color`; CSS custom properties are left alone. */
function toKebabCase(property: string): string {
  if (property.startsWith("--")) return property;
  return property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** The stored attributes of a component as the strings a block reads. */
function toBlockAttributes(component: Component): Record<string, string> {
  const attributes: Record<string, string> = {};
  Object.entries(component.getAttributes()).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    attributes[key] = typeof value === "string" ? value : String(value);
  });
  return attributes;
}

/**
 * The inner HTML for a component whose children React must not track one by one, or `null` when the
 * children have to be rendered as React nodes. Mirrors core: `ComponentView.updateContent` writes
 * `content` as HTML, and `ComponentTextNodeView` writes a textnode's `content` as text (hence the
 * escaping). One `__html` string keeps a `contenteditable` session from fighting React.
 */
function getInnerHtml(component: Component): string | null {
  const children = component.components();

  if (!children.length) {
    const content = component.get("content");
    return typeof content === "string" && content ? content : null;
  }

  const models = children.models;
  if (!models.every((child) => child.get("type") === "textnode")) return null;

  return models.map((child) => escapeHtml(String(child.get("content") ?? ""))).join("");
}

/* --------------------------------- View binding --------------------------------- */

/** The few members of core's view classes this renderer overrides or reads. */
type CanvasViewLike = {
  el?: HTMLElement;
  model?: Component;
  opts?: { wrapperStyle?: React.CSSProperties; onViewRemove?: () => void };
  preinitialize(options?: Record<string, unknown>): void;
  _setData(): void;
  renderAttributes(): void;
  updateScript(): void;
  postRender(): void;
  updateAttributes(): void;
  updateClasses(...args: unknown[]): void;
  updateStyle(...args: unknown[]): void;
  remove(): unknown;
};

type ComponentViewConstructor = new (options: Record<string, unknown>) => CanvasViewLike;

const viewClassCache = new WeakMap<ComponentViewConstructor, ComponentViewConstructor>();

/**
 * Derives a canvas-safe `ComponentView` from a registered type's own view class, so every type keeps
 * its behaviour while the methods that build or destroy DOM become inert: React owns the element and
 * the whole subtree.
 */
function createCanvasViewClass(Base: ComponentViewConstructor): ComponentViewConstructor {
  return class CanvasComponentView extends Base {
    /** The React-rendered element this view was bound to. */
    __reactEl?: HTMLElement;
    /** `remove()` is reachable from both React unmount and core teardown; run it once. */
    __removed = false;

    override preinitialize(options: Record<string, unknown> = {}) {
      super.preinitialize(options);
      this.__reactEl = options.el as HTMLElement | undefined;
    }

    /** React renders the subtree from the models; core would build a second, detached copy. */
    renderChildren() {
      /* React owns the children. */
    }

    /** Core sets `innerHTML` here, which would blow away everything React rendered. */
    updateContent() {
      /* React renders `content`, see `getInnerHtml`. */
    }

    /** Backbone's `remove()` detaches the element; only React may remove canvas DOM. */
    _removeElement() {
      /* React owns the element. */
    }

    /** Only reached if core tries to rebuild the element: hand back the one React made. */
    _createElement() {
      return this.__reactEl;
    }

    /** Core swaps in a freshly built element here; React re-renders the node instead. */
    reset() {
      this._setData();
      this.renderAttributes();
    }

    /** Core's `render()` minus `renderChildren()`. `postRender()` must still run: it sets
     *  `rendered`, which `EditorModel.addSelected` checks before activating a dropped block. */
    render() {
      this._setData();
      this.renderAttributes();
      this.updateScript();
      this.postRender();
      return this;
    }

    /** `__clearAttributes()` strips every attribute, the configured wrapper style included. */
    override updateAttributes() {
      super.updateAttributes();
      this.applyWrapperStyle();
    }

    /** An empty model style removes the whole `style` attribute, wrapper style included. */
    override updateStyle(...args: unknown[]) {
      super.updateStyle(...args);
      this.applyWrapperStyle();
    }

    /** Re-applies `wrapperStyle` after core has rewritten the element's `style` attribute. */
    applyWrapperStyle() {
      const wrapperStyle = this.opts?.wrapperStyle;
      const el = this.el;
      if (!wrapperStyle || !el?.style) return;

      Object.entries(wrapperStyle).forEach(([property, value]) => {
        if (value === undefined || value === null || value === "") return;
        el.style.setProperty(toKebabCase(property), String(value));
      });
    }

    /**
     * Core tears a frame down through `FrameView.remove()` -> `frameView.wrapper.remove()`, and that
     * is the only teardown hook that fires on `loadProjectData`. The frame's root view therefore
     * carries the React root's disposer.
     */
    override remove() {
      if (this.__removed) return this;
      this.__removed = true;
      const result = super.remove();
      this.opts?.onViewRemove?.();
      return result;
    }
  };
}

/** Returns the canvas-safe view class for a component type, one per base view class. */
function getCanvasViewClass(editor: Editor, type: string): ComponentViewConstructor | undefined {
  const components = editor.Components;
  const base = (components.getType(type)?.view ?? components.getType("default")?.view) as
    ComponentViewConstructor | undefined;
  if (!base) return undefined;

  const cached = viewClassCache.get(base);
  if (cached) return cached;

  const created = createCanvasViewClass(base);
  viewClassCache.set(base, created);
  return created;
}

type BindOptions = {
  wrapperStyle?: React.CSSProperties;
  onViewRemove?: () => void;
};

/**
 * Binds a React-rendered element to its component's `ComponentView` for this frame. The view's
 * `initialize` registers the element in every lookup channel the editor uses; the `render()`
 * override then writes the attributes, classes and status.
 */
function bindComponentView(
  ctx: CanvasRendererContextValue,
  component: Component,
  el: HTMLElement,
  options: BindOptions
): ComponentView | undefined {
  const { editor, frameView } = ctx;

  try {
    const existing = component.getView(frameView.model) as ComponentView | undefined;
    if (existing?.el === el) return existing;
    existing?.remove();

    const ViewClass = getCanvasViewClass(editor, component.get("type") || "default");
    if (!ViewClass) return undefined;

    const view = new ViewClass({
      el,
      model: component,
      wrapperStyle: options.wrapperStyle,
      onViewRemove: options.onViewRemove,
      config: {
        ...editor.Components.getConfig(),
        em: editor.getModel(),
        frameView,
      },
    });

    return (view as unknown as ComponentView).render() as ComponentView;
  } catch {
    // A frame can be torn down mid-render; never break the whole canvas over one node.
    return undefined;
  }
}

/** Disposes a bound view without touching the DOM (React removes the element itself). */
function releaseComponentView(view: ComponentView | null): void {
  try {
    view?.remove();
  } catch {
    // The frame document may already be gone.
  }
}

/** Whether a component's DOM is rewritten by the browser rather than by React (core's rich text). */
function isTextComponent(component: Component): boolean {
  try {
    return component.isInstanceOf("text");
  } catch {
    return false;
  }
}

/**
 * The tag a component renders as. Asks the registered view class first because core types override
 * it: the wrapper's model says `body` while `ComponentWrapperView` renders a `div`.
 */
function resolveTagName(editor: Editor, component: Component): string {
  const type = component.get("type") || "default";
  const view = editor.Components.getType(type)?.view as
    { prototype?: { tagName?: string | ((this: { model: Component }) => string) } } | undefined;
  const viewTagName = view?.prototype?.tagName;

  const tagName =
    typeof viewTagName === "function"
      ? viewTagName.call({ model: component })
      : typeof viewTagName === "string"
        ? viewTagName
        : component.get("tagName");

  return typeof tagName === "string" && tagName ? tagName : "div";
}

/* --------------------------------- Nodes --------------------------------- */

type BoundaryProps = {
  /** Bumped on every re-render of the node, so a model change retries a failed block. */
  resetKey: number;
  children: React.ReactNode;
};

type BoundaryState = {
  hasError: boolean;
  /** The `resetKey` the current state belongs to. */
  seenKey: number;
  /** The `resetKey` an automatic retry has already been spent on. */
  retriedKey: number | null;
  /** Retries already spent on edits made elsewhere in the page, see `MAX_EDIT_RETRIES`. */
  editRetries: number;
};

/**
 * How many times a failed block retries on an edit made somewhere else in the page: a container
 * that failed on data from a child comes back once the child is corrected, while a block that
 * fails deterministically settles as an empty wrapper instead of looping.
 */
const MAX_EDIT_RETRIES = 3;

/**
 * Keeps one misbehaving block from taking the canvas down with it. There is a single React root per
 * frame, so an error thrown by a block component would otherwise unmount the whole tree and leave a
 * blank iframe. The bound `<gjs-wrapper>` is outside the boundary, so a failed block stays
 * selectable and deletable.
 */
class CanvasErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  static override contextType = CanvasRendererContext;
  declare context: CanvasRendererContextValue | null;

  /** Detaches the `component:update` listener a failed boundary subscribes to. */
  private stopWatchingEdits?: () => void;

  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, seenKey: props.resetKey, retriedKey: null, editRetries: 0 };
  }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState) {
    if (props.resetKey === state.seenKey) return null;
    return { hasError: false, seenKey: props.resetKey, editRetries: 0 };
  }

  override componentDidCatch() {
    const { resetKey } = this.props;
    this.watchEdits();
    if (this.state.retriedKey === resetKey) return;

    setTimeout(() => {
      this.setState((state) =>
        state.hasError && state.seenKey === resetKey
          ? { ...state, hasError: false, retriedKey: resetKey }
          : state
      );
    }, 0);
  }

  override componentDidUpdate() {
    if (!this.state.hasError || this.state.editRetries >= MAX_EDIT_RETRIES) {
      this.unwatchEdits();
    }
  }

  override componentWillUnmount() {
    this.unwatchEdits();
  }

  private watchEdits() {
    if (this.stopWatchingEdits) return;
    if (this.state.editRetries >= MAX_EDIT_RETRIES) return;
    const editor = this.context?.editor;
    if (!editor) return;

    const retry = () =>
      this.setState((state) =>
        state.hasError && state.editRetries < MAX_EDIT_RETRIES
          ? { ...state, hasError: false, editRetries: state.editRetries + 1 }
          : state
      );

    editor.on("component:update", retry);
    this.stopWatchingEdits = () => editor.off("component:update", retry);
  }

  private unwatchEdits() {
    this.stopWatchingEdits?.();
    this.stopWatchingEdits = undefined;
  }

  override render() {
    return this.state.hasError ? null : this.props.children;
  }
}

type TreeBoundaryState = { failed: boolean; recoveries: number };

/** How many times the tree may rebuild itself before it stops trying. */
const MAX_TREE_RECOVERIES = 5;

/**
 * The last net under the whole frame tree. A DOM error thrown in React's commit phase (a
 * `removeChild` for a node something else moved, typically) would otherwise unmount the root and
 * blank the iframe. Rebuilding the subtree under a fresh key renders it again from the models,
 * while the wrapper's own view (and the React root's disposer) survives.
 */
class CanvasTreeBoundary extends React.Component<{ children: React.ReactNode }, TreeBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false, recoveries: 0 };
  }

  static getDerivedStateFromError(): Partial<TreeBoundaryState> {
    return { failed: true };
  }

  override componentDidCatch() {
    this.setState((state) => ({ failed: false, recoveries: state.recoveries + 1 }));
  }

  override render() {
    const { failed, recoveries } = this.state;
    // The key has to differ in the error render itself, so one error costs exactly one rebuild.
    return (
      <React.Fragment key={recoveries + (failed ? 1 : 0)}>
        {recoveries > MAX_TREE_RECOVERIES ? null : this.props.children}
      </React.Fragment>
    );
  }
}

type ComponentNodeProps = {
  component: Component;
  /** Set on the frame's wrapper only: core's `onMount`, called once after the first commit. */
  onRootMount?: CustomRendererProps["onMount"];
  /** Set on the frame's wrapper only: unmounts the React root when core drops the frame. */
  onRootRemove?: () => void;
};

/**
 * Renders one GrapesJS component and, recursively, its children. A type present in the renderer
 * config renders as `<gjs-wrapper><Block …>{children}</Block></gjs-wrapper>`; everything else (the
 * frame wrapper, plain nodes) renders as its own tag. The bound element is always the outer one, so
 * `wrapperStyle`, the stored id and classes and the editor's own CSS keep targeting `<gjs-wrapper>`.
 */
function ComponentNode({ component, onRootMount, onRootRemove }: ComponentNodeProps) {
  const ctx = useContext(CanvasRendererContext);
  // Read per node, not through the context: the context value must stay stable for the life of
  // the frame, since a new value rebinds every element and the wrapper's rebind disposes the root.
  const locale = useSyncExternalStore(subscribeEditingLocale, getEditingLocale, getEditingLocale);
  const [renderTick, forceRender] = useReducer((tick: number) => tick + 1, 0);
  const viewRef = useRef<ComponentView | null>(null);
  const mountedRef = useRef(false);

  const type = component.get("type") || "default";
  const entry: CanvasRendererComponent | undefined = ctx?.config.components[type];

  const bindEl = useCallback(
    (node: Element | null) => {
      if (!ctx) return;
      if (node) {
        viewRef.current =
          bindComponentView(ctx, component, node as HTMLElement, {
            wrapperStyle: entry?.wrapperStyle,
            onViewRemove: onRootRemove,
          }) ?? null;
      } else {
        releaseComponentView(viewRef.current);
        viewRef.current = null;
      }
    },
    [ctx, component, entry, onRootRemove]
  );

  useEffect(() => {
    const children = component.components();
    const classes = component.classes;

    component.on(NODE_EVENTS, forceRender);
    children.on(CHILDREN_EVENTS, forceRender);
    classes?.on(CLASS_EVENTS, forceRender);

    return () => {
      component.off(NODE_EVENTS, forceRender);
      children.off(CHILDREN_EVENTS, forceRender);
      classes?.off(CLASS_EVENTS, forceRender);
    };
  }, [component]);

  useEffect(() => {
    if (!onRootMount || !ctx || mountedRef.current) return;
    mountedRef.current = true;

    // Runs from a mount effect, so React's first commit is already in the document: that commit
    // clears the frame body of everything but `<style>`, and it would wipe the CSS-rules and script
    // containers `_onRootMount` appends.
    setTimeout(() => {
      const view = viewRef.current;
      const iframe = ctx.frameView.el;
      // The frame can be dropped between the commit and this tick (project reload).
      if (!view || !iframe?.contentDocument || iframe.contentDocument !== view.el?.ownerDocument) {
        return;
      }
      onRootMount(view);
    }, 0);
  }, [ctx, onRootMount]);

  if (type === "textnode") return <>{String(component.get("content") ?? "")}</>;
  if (type === "comment" || !ctx) return null;

  const childNodes = component
    .components()
    .models.map((child) => <ComponentNode key={child.cid ?? child.getId()} component={child} />);

  // The frame's wrapper carries the tree-wide net, one level below its own element so that the
  // wrapper view core holds on to is never rebuilt.
  const children = onRootMount ? <CanvasTreeBoundary>{childNodes}</CanvasTreeBoundary> : childNodes;

  if (entry) {
    const Block = entry.component;
    const blockProps: BlockProps = {
      attributes: toBlockAttributes(component),
      locale,
      defaultLocale: getDefaultContentLocale(),
      children: childNodes.length ? children : undefined,
    };
    return createElement(
      "gjs-wrapper",
      { ref: bindEl },
      <CanvasErrorBoundary resetKey={renderTick}>
        <Block {...blockProps} />
      </CanvasErrorBoundary>
    );
  }

  const tagName = resolveTagName(ctx.editor, component);

  // A `text` component's DOM belongs to the browser for the length of a `contenteditable`
  // session; re-keying the element on every update makes React mount a fresh one from the model.
  const elementKey = isTextComponent(component) ? renderTick : undefined;

  if (VOID_TAGS.has(tagName)) return createElement(tagName, { key: elementKey, ref: bindEl });
  if (tagName === "textarea") return createElement(tagName, { key: elementKey, ref: bindEl });

  const innerHtml = getInnerHtml(component);
  if (innerHtml !== null) {
    return createElement(tagName, {
      key: elementKey,
      ref: bindEl,
      dangerouslySetInnerHTML: { __html: innerHtml },
    });
  }

  return createElement(tagName, { key: elementKey, ref: bindEl }, children);
}

type CanvasRootProps = {
  editor: Editor;
  frameView: CustomRendererProps["frameView"];
  config: CanvasRendererConfig;
  frame: Frame;
  onMount: CustomRendererProps["onMount"];
  onRemove: () => void;
};

/** The frame's React tree: the (stable) renderer context over the wrapper component. */
function CanvasRoot({ editor, frameView, config, frame, onMount, onRemove }: CanvasRootProps) {
  const value = React.useMemo<CanvasRendererContextValue>(
    () => ({ editor, frameView, config }),
    [editor, frameView, config]
  );
  return (
    <CanvasRendererContext.Provider value={value}>
      <ComponentNode
        component={frame.getComponent()}
        onRootMount={onMount}
        onRootRemove={onRemove}
      />
    </CanvasRendererContext.Provider>
  );
}

/* --------------------------------- Public API --------------------------------- */

/**
 * Builds the `CanvasConfig.customRenderer` for the page-builder canvas: one React root per frame,
 * mounted on the frame body, rendering the frame's wrapper component and everything under it in
 * the current editing locale.
 *
 * @param config the component map (block type id → React component + wrapper style)
 * @param queryClient the host's React Query client, so a block that reads through `@services`
 *   hooks on the canvas shares one cache with the admin around it (no block does today; the
 *   provider stays for the next one)
 */
export function createCanvasRenderer(config: CanvasRendererConfig, queryClient?: QueryClient) {
  const roots = new WeakMap<HTMLElement, Root>();

  return function renderCanvasFrame({
    editor,
    frame,
    window: frameWindow,
    frameView,
    onMount,
  }: CustomRendererProps): void {
    try {
      const body = frameWindow.document.body;
      let disposed = false;

      // Core calls this once per iframe load, so the same Frame model can come back on a new
      // document. Drop any root still sitting on this body before opening another one.
      roots.get(body)?.unmount();

      const root = createRoot(body);
      roots.set(body, root);

      const dispose = () => {
        if (disposed) return;
        disposed = true;
        editor.off(editor.Canvas.events.frameUnload, handleFrameUnload);
        frameWindow.removeEventListener("unload", dispose);
        if (roots.get(body) === root) roots.delete(body);
        // Deferred: core's teardown reaches this from inside React's own unmount, and React
        // refuses a synchronous unmount while it is rendering.
        setTimeout(() => {
          try {
            root.unmount();
          } catch {
            // The frame document may already be gone.
          }
        }, 0);
      };

      function handleFrameUnload(props: { frame?: Frame }) {
        if (!props?.frame || props.frame === frame) dispose();
      }

      editor.on(editor.Canvas.events.frameUnload, handleFrameUnload);
      frameWindow.addEventListener("unload", dispose, { once: true });

      root.render(
        <QueryClientProvider queryClient={queryClient}>
          <CanvasRoot
            editor={editor}
            frameView={frameView}
            config={config}
            frame={frame}
            onMount={onMount}
            onRemove={dispose}
          />
        </QueryClientProvider>
      );
    } catch {
      // `renderBody` has no error handling of its own: a throw here kills the canvas.
    }
  };
}
