import type { BuilderBlockDefinition } from "../types";
import { ButtonBlock } from "./button";
import { ColumnBlock } from "./column";
import { ColumnsBlock } from "./columns";
import { CtaBannerBlock } from "./cta-banner";
import { DividerBlock } from "./divider";
import { FaqBlock } from "./faq";
import { FaqItemBlock } from "./faq-item";
import { FeatureCardBlock } from "./feature-card";
import { FeatureGridBlock } from "./feature-grid";
import { HeadingBlock } from "./heading";
import { HeroBlock } from "./hero";
import { ImageBlock } from "./image";
import { SectionBlock } from "./section";
import { SpacerBlock } from "./spacer";
import { TextBlock } from "./text";
import { VideoBlock } from "./video";

export { ButtonBlock, ButtonBlockComponent, BUTTON_FIELDS } from "./button";
export { ColumnBlock, ColumnBlockComponent, COLUMN_FIELDS } from "./column";
export { ColumnsBlock, ColumnsBlockComponent, COLUMNS_FIELDS } from "./columns";
export { CtaBannerBlock, CtaBannerBlockComponent, CTA_BANNER_FIELDS } from "./cta-banner";
export { DividerBlock, DividerBlockComponent, DIVIDER_FIELDS } from "./divider";
export { FaqBlock, FaqBlockComponent, FAQ_FIELDS } from "./faq";
export { FaqItemBlock, FaqItemBlockComponent, FAQ_ITEM_FIELDS } from "./faq-item";
export { FeatureCardBlock, FeatureCardBlockComponent, FEATURE_CARD_FIELDS } from "./feature-card";
export { FeatureGridBlock, FeatureGridBlockComponent, FEATURE_GRID_FIELDS } from "./feature-grid";
export { HeadingBlock, HeadingBlockComponent, HEADING_FIELDS } from "./heading";
export { HeroBlock, HeroBlockComponent, HERO_FIELDS } from "./hero";
export { ImageBlock, ImageBlockComponent, IMAGE_FIELDS } from "./image";
export { SectionBlock, SectionBlockComponent, SECTION_FIELDS } from "./section";
export { SpacerBlock, SpacerBlockComponent, SPACER_FIELDS } from "./spacer";
export { TextBlock, TextBlockComponent, TEXT_FIELDS } from "./text";
export { VideoBlock, VideoBlockComponent, VIDEO_FIELDS } from "./video";
export { BLOCK_ICON_OPTIONS, BLOCK_ICONS } from "./shared/icons";

/** Every block, in palette order. */
export const BUILDER_BLOCK_LIST: BuilderBlockDefinition[] = [
  SectionBlock,
  ColumnsBlock,
  ColumnBlock,
  SpacerBlock,
  DividerBlock,
  HeadingBlock,
  TextBlock,
  ButtonBlock,
  FaqBlock,
  FaqItemBlock,
  ImageBlock,
  VideoBlock,
  HeroBlock,
  FeatureGridBlock,
  FeatureCardBlock,
  CtaBannerBlock,
];

/** Every block by its type id: the registry the editor and the renderer share. */
export const BUILDER_BLOCKS: Record<string, BuilderBlockDefinition> = Object.fromEntries(
  BUILDER_BLOCK_LIST.map((block) => [block.type, block])
);
