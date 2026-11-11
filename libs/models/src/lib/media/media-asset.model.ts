import { BaseModel } from "../base";
import { resolveLocalizedText } from "../localized";
import type { IMediaAssetModel } from "./media-asset.interface";

/** Typed getters over a media library record (an uploaded file). */
export class MediaAssetModel extends BaseModel<IMediaAssetModel> {
  getUrl(): string {
    return this.props.url ?? "";
  }

  getName(): string {
    return this.props.name ?? "";
  }

  getMime(): string {
    return this.props.mime ?? "";
  }

  /** Size in bytes. */
  getSize(): number {
    return this.props.size ?? 0;
  }

  getWidth(): number | null {
    return this.props.width ?? null;
  }

  getHeight(): number | null {
    return this.props.height ?? null;
  }

  /** The alt text in `locale`, else in `fallbackLocale`, else the first translation present. */
  getAlt(locale: string, fallbackLocale?: string): string {
    return resolveLocalizedText(this.props.alt, locale, fallbackLocale);
  }

  isImage(): boolean {
    return this.getMime().startsWith("image/");
  }

  isVideo(): boolean {
    return this.getMime().startsWith("video/");
  }
}
