import type { Editor, ProjectData } from "grapesjs";
import type { PageContentDto } from "@dtos";

/**
 * The two shapes of a page's content, and the conversions between them.
 *
 * - The backend stores `PageContentDto`: `components` (the GrapesJS component JSON of the
 *   root's children), `styles` (the GrapesJS CssRule JSON) and `css` (the compiled CSS).
 * - GrapesJS edits `ProjectData`: `pages[0].frames[0].component` is the wrapper whose
 *   `components` are the root's children, and `styles` is the same rule list.
 *
 * Both editors (Core and Studio) go through these two functions, so they save the same format.
 */

/** The wrapper's children of a project's first page, or `[]`. */
function projectComponents(project: ProjectData | undefined): unknown[] {
  const component = project?.pages?.[0]?.frames?.[0]?.component as
    { components?: unknown } | undefined;
  return Array.isArray(component?.components) ? component.components : [];
}

/**
 * The GrapesJS project a page's draft loads as: one page, one frame, a `wrapper` holding the
 * stored components, plus the stored CSS rules.
 *
 * @param draft the page's `draft` (or `published`) content
 */
export function toProjectData(draft: PageContentDto | null | undefined): ProjectData {
  return {
    pages: [
      {
        frames: [
          {
            component: {
              type: "wrapper",
              components: Array.isArray(draft?.components) ? draft.components : [],
            },
          },
        ],
      },
    ],
    styles: Array.isArray(draft?.styles) ? draft.styles : [],
  };
}

/**
 * The page content a project holds, with the CSS compiled by the editor.
 *
 * @param project the project data (from `editor.getProjectData()` or the Studio SDK's `onSave`)
 * @param css the compiled CSS (`editor.getCss({ avoidProtected: true })`)
 */
export function fromProjectData(project: ProjectData | undefined, css: string): PageContentDto {
  return {
    components: projectComponents(project),
    styles: Array.isArray(project?.styles) ? project.styles : [],
    css,
  };
}

/**
 * The draft to save, read from the live editor: the root's children as component JSON, the
 * CSS rules and the compiled CSS without core's protected prefix.
 *
 * @param editor the live editor
 */
export function readDraft(editor: Editor): PageContentDto {
  return fromProjectData(editor.getProjectData(), editor.getCss({ avoidProtected: true }) ?? "");
}
