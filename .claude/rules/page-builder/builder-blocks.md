---
paths:
  - "**/builder/**"
  - "**/grapesjs/**"
---

# Page builder blocks and editors

Project-specific rules for repositories that ship the GrapesJS page builder. They extend the
components-library and layered-architecture rules; they do not replace them.

## Blocks

- A block is a folder under the components lib's `builder/blocks/<type>/` holding a plain React
  component, its field definitions (`defineFields([...])`) and a block definition object
  (`type`, `label`, `category`, `icon`, `fields`, `defaults`, `component`, child rules).
- Blocks are registered in one list (`blocks/index.ts`). The editor palette, the canvas
  renderer and the public page renderer all derive everything from the definition. Nothing in
  either app changes when a block is added.
- A block never fetches. It receives its attributes and children and renders. If a block needs
  live data, an app-layer wrapper injects it through props.
- Visitor-facing text lives in translatable attributes keyed by content locale. A list of texts
  is a list of child blocks, never a JSON array inside one attribute.
- Every default text a palette tile drops has a value for every content locale.
- Blocks use logical CSS and theme tokens; they render correctly in RTL without overrides.

## Editors

- The Core editor is the default and needs no licence. The Studio editor is optional, switched
  on by environment variables only, and falls back to Core with a notice when its licence is
  absent on a non-local host.
- Only the Studio options module and the Studio host component may import the Studio SDK; an
  ESLint `no-restricted-imports` entry enforces this. The host is loaded dynamically so
  Core-only builds never bundle the SDK.
- Both editors load and save the same page format. A page built in one opens in the other.
- Editor registration modules (plugin, traits, asset provider, canvas renderer) do
  registration and configuration only. Business logic stays in feature hooks.
- The canvas renderer owns one React root per frame; the element tree is React's, while the
  bound editor view writes attributes, classes and status. Never render attributes from React
  onto a bound element.

## Pages

- Draft and published are separate snapshots. Publish copies draft to published; unpublish
  clears published only; saving a draft never changes what visitors see.
- Page content is sanitized on the way out of the editor and on the way into the renderer
  (component tree, CSS and HTML). Never render stored HTML unsanitized.
- One slug serves every locale; translatable texts resolve per locale at render time, falling
  back to the default locale.

## Licence and credentials

- The licence key variable is public by necessity (the editor runs in the browser) and is
  empty in `.env.example`. The repository never contains a real key. The documentation states
  the variable names, where to obtain a key, and that local hosts need none.
