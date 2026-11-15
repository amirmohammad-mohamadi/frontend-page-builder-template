---
name: add-builder-block
description: Add a block to the GrapesJS page builder of this stack: component, field definitions, block definition, registration, palette icon, translatable defaults, tests and documentation. Use when asked to "add a block", "add a section type to the builder" or "let editors drop a <thing>" in a repository that ships the page builder.
argument-hint: <block-type> [category]
---

# Add a builder block

Blocks are plain React components with a field definition; the editor palette, the canvas and
the public renderer all derive from it (`rules/page-builder/builder-blocks.md`). Nothing in
either app changes when a block is added.

## Before starting

1. Read two existing blocks in the same category (one leaf block and one container block with
   its child type, whatever the repository calls them) and the builder README in the components
   lib. Your block mirrors their file layout exactly.
2. Decide: leaf or container; which parents may hold it (`childOf`); which children it accepts
   (`children`, `droppable`); which attributes are translatable.

## Steps

1. **Folder**: `libs/components/src/lib/builder/blocks/<type>/index.tsx` (single-app:
   `src/shared/components/builder/blocks/<type>/`).
2. **Fields**: `defineFields([...])` with one entry per editable attribute: text, translatable
   text, rich text, image, link, select, number, toggle. Translatable fields store a JSON
   object keyed by content locale; use the shared helpers to read and write them.
3. **Component**: receives `BlockProps` (`attributes`, `locale`, `defaultLocale`, `children`),
   resolves translatable attributes for the active locale with the shared resolver, renders with
   logical CSS and theme tokens, and renders `children` where child blocks go. No fetching, no
   `@services`, no window access during render.
4. **Definition**: `type`, `label`, `category`, `icon`, `fields`, `defaults` (a value for every
   field, translated defaults for every content locale), `component`, and the child rules.
   Export it as a named constant.
5. **Register** in `BUILDER_BLOCK_LIST` (`blocks/index.ts`). Keep the list grouped by category.
6. **Icon**: add the palette icon mapping in the admin's palette-icons module when the block
   needs one other than the category default.
7. **Sanitizer**: if the block introduces a new HTML-bearing attribute, make sure the sanitizer
   allows exactly what it renders and nothing more.
8. **Tests**: a render test with resolved locale text and with a missing locale falling back to
   the default; a definition test that every field has a default and every translatable
   default covers every content locale (the repository's existing spec files show the shape).
9. **Docs**: the block list in the builder README and, if the block adds a concept, a line in
   `docs/builder.md`.

## Verify

- Open the Core editor, drop the block, edit each field in two locales, save, reload, and see
  the values persist. Publish and open the page in both locales on the public app.
- If the repository has the Studio editor enabled locally, repeat the drop and edit there; the
  palette must show the block once, not twice.
- Quality gates (`/check`) and the production build.
