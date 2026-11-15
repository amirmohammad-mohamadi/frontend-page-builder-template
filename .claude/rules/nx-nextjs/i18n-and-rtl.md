---
paths:
  - "apps/**"
  - "libs/components/**"
  - "src/app/**"
  - "src/features/**"
  - "src/shared/components/**"
  - "**/messages/*.json"
---

# Internationalisation and right-to-left

Rules for any app that serves more than one locale, and for shared components that may be
rendered in one. `skills/rtl-audit` finds violations mechanically.

## Strings

- A localized app never hard-codes user-facing text: every label, placeholder, toast and
  message goes through `t("key")`. Message files live per locale under `messages/`.
- An English-only admin app keeps its copy in a texts module (`texts.ts`), never inline in JSX,
  so copy changes are one-file changes and the app can be localized later.
- Keys are added to every locale file in the same commit. A missing key is a bug, not a
  fallback.
- Content locales (texts stored inside page data) are a separate list from UI locales. The two
  lists must stay in sync and are declared once each; the repository's `AGENTS.md` names where.

## Layout

- Logical CSS properties only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`,
  `text-start`, `text-end`, `rounded-s-*`, `border-s-*`. Never `ml`, `mr`, `pl`, `pr`,
  `left`, `right`, `text-left`, `text-right`.
- Direction is derived from the locale once, at the `<html dir>` level. Components never set
  `dir` themselves, except an explicitly bidirectional input.
- Icons that imply direction (arrows, chevrons, "next") flip with `rtl:` variants or are
  rendered from a direction-aware pair.
- Phone numbers, codes, prices and other mixed-direction runs are wrapped in `<bdi>` or given
  `dir="ltr"` explicitly. Inside a `bdi`, digit sequences keep their visual order.

## Formatting

- Numbers, dates and currency go through `Intl` wrappers in `@utils` with the active locale and
  the configured currency. Never a hard-coded currency symbol or `en-US`.
- Fonts with Persian or Arabic digits may need `tabular-nums` for aligned columns; check tables
  in the RTL locale, not only in English.

## Verification

- Every UI change is opened in at least one right-to-left locale before it is called done.
- The direction attribute, the heading text and the layout mirroring are checked, not assumed.
