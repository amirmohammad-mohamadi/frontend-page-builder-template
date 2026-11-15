---
name: rtl-audit
description: Find internationalisation and right-to-left defects in a set of files or a diff: physical CSS classes (ml, pr, left, text-right), hard-coded user-facing strings in JSX, hard-coded currency symbols and locales, and message keys missing from a locale file. Use before calling UI work done in a multi-locale app, or when the user reports a layout that breaks in Persian or Arabic.
argument-hint: [paths or --diff <base>]
allowed-tools: Bash(node *), Bash(git diff *), Bash(git ls-files *), Read, Grep, Glob
---

# RTL and i18n audit

The rules are in `rules/nx-nextjs/i18n-and-rtl.md`. This skill is the mechanical pass plus the
list of what to check by eye.

## Mechanical pass

Run the script on the files in question (defaults to the files changed against the default
branch; pass paths or `--diff <base>`):

```bash
node "${CLAUDE_SKILL_DIR}/scripts/find-rtl-issues.mjs" $ARGUMENTS
```

It reports, with file and line:

- physical Tailwind classes and inline styles (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`,
  `text-left`, `text-right`, `rounded-l-`, `rounded-r-`, `border-l-`, `border-r-`,
  `float-left`, `float-right`, and `marginLeft` style keys);
- JSX text nodes and common string props (`placeholder`, `title`, `aria-label`, `alt`, `label`)
  that contain letters, on lines that do not call `t(` or read a texts module;
- hard-coded currency symbols next to interpolations and `toLocaleString("en-US")` style calls;
- message keys used in code that are missing from one of the owning app's `messages/*.json`
  files, when the app has such files.

By default it audits the working tree against the default branch (staged, unstaged and new
files alike).

Treat the output as candidates. A `pl-` inside a URL or a translation key is not a defect.

## By eye

Open the changed screens in one left-to-right and one right-to-left locale and check:

- the `<html dir>` attribute and the mirrored layout (sidebars, breadcrumbs, pagination);
- direction-bearing icons flipped;
- mixed-direction runs (phone numbers, codes, prices) read correctly;
- tables with Persian or Arabic digits stay aligned;
- toasts and dialogs anchor to the correct side.

## Report

List confirmed defects with `path:line` and the fix, then the candidates you dismissed and why.
