import type { IBaseModel } from "../base";
import type { LocalizedText } from "../localized";

export type PageStatus = "draft" | "published";

/** The GrapesJS component JSON tree (root children), its CssRule JSON and the compiled CSS. */
export type PageContent = {
  components: unknown[];
  styles: unknown[];
  css?: string;
};

export type PageSeo = {
  description?: LocalizedText;
  image?: string | null;
};

export type IPageModel = IBaseModel & {
  slug: string;
  status: PageStatus;
  title: LocalizedText;
  seo?: PageSeo | null;
  draft: PageContent;
  published: PageContent | null;
  published_at: string | null;
};
