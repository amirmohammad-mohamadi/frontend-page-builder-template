import { BaseModel } from "../base";
import { resolveLocalizedText } from "../localized";
import type { IPageModel, PageContent, PageStatus } from "./page.interface";

const EMPTY_CONTENT: PageContent = { components: [], styles: [] };

/** Typed getters over a builder page record; pages read these, never raw fields. */
export class PageModel extends BaseModel<IPageModel> {
  getSlug(): string {
    return this.props.slug ?? "";
  }

  /** The title in `locale`, else in `fallbackLocale`, else the first translation present. */
  getTitle(locale: string, fallbackLocale?: string): string {
    return resolveLocalizedText(this.props.title, locale, fallbackLocale);
  }

  getStatus(): PageStatus {
    return this.props.status ?? "draft";
  }

  /** `true` when a published copy exists; the public app renders only such pages. */
  isPublished(): boolean {
    return this.getStatus() === "published" && this.props.published != null;
  }

  /** The content the editor works on; never `null`. */
  getDraft(): PageContent {
    return this.props.draft ?? EMPTY_CONTENT;
  }

  /** The content the public app renders, or `null` while unpublished. */
  getPublished(): PageContent | null {
    return this.props.published ?? null;
  }

  getPublishedAt(): Date | null {
    return this.props.published_at ? new Date(this.props.published_at) : null;
  }

  getSeoDescription(locale: string, fallbackLocale?: string): string {
    return resolveLocalizedText(this.props.seo?.description, locale, fallbackLocale);
  }

  /** The social-sharing image URL, or `null` when none is set. */
  getSeoImage(): string | null {
    return this.props.seo?.image || null;
  }
}
