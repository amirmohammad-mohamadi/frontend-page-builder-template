import type { IBaseModel } from "../base";
import type { LocalizedText } from "../localized";

export type IMediaAssetModel = IBaseModel & {
  url: string;
  name: string;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  alt: LocalizedText;
};
