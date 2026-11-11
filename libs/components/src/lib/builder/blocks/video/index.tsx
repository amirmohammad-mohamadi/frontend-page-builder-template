import { Play } from "lucide-react";
import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import { safeUrl } from "../../sanitize/sanitize-html";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options } from "../shared/defaults";

const ASPECTS: Readonly<Record<string, string>> = {
  video: "aspect-video",
  classic: "aspect-[4/3]",
  square: "aspect-square",
  portrait: "aspect-[9/16]",
};

export const VIDEO_FIELDS = defineFields([
  { name: "src", label: "Video", type: "video", category: "Content", accept: "video" },
  { name: "poster", label: "Poster image", type: "image", category: "Content", accept: "image" },
  {
    name: "controls",
    label: "Show controls",
    type: "checkbox",
    category: "Behavior",
    default: "true",
  },
  {
    name: "autoplay",
    label: "Autoplay (muted)",
    type: "checkbox",
    category: "Behavior",
    default: "false",
  },
  { name: "loop", label: "Loop", type: "checkbox", category: "Behavior", default: "false" },
  { name: "muted", label: "Muted", type: "checkbox", category: "Behavior", default: "false" },
  {
    name: "aspect",
    label: "Aspect ratio",
    type: "select",
    category: "Layout",
    default: "video",
    options: options([
      ["video", "16:9"],
      ["classic", "4:3"],
      ["square", "1:1"],
      ["portrait", "9:16"],
    ]),
  },
]);

/**
 * A video file from the media library in a clipped, fixed-ratio card. Autoplay
 * implies muted and inline playback, the two conditions browsers require to
 * start a video without a gesture. Without a source it shows a play glyph.
 */
export function VideoBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { src, poster, controls, autoplay, loop, muted, aspect } = fieldsToProps(
    VIDEO_FIELDS,
    attributes,
    {
      locale,
      defaultLocale,
    }
  );
  const source = safeUrl(src);
  const posterUrl = safeUrl(poster);
  const frame = cn(
    "bg-muted relative w-full overflow-hidden rounded-xl",
    ASPECTS[aspect] ?? ASPECTS.video,
    className
  );

  if (!source) {
    return (
      <div id={id} className={cn(frame, "text-muted-foreground flex items-center justify-center")}>
        {posterUrl ? (
          <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <Play className="relative size-14" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div id={id} className={frame}>
      <video
        src={source}
        poster={posterUrl}
        controls={controls}
        autoPlay={autoplay}
        muted={autoplay || muted}
        loop={loop}
        playsInline
        preload="metadata"
        className="block h-full w-full object-cover"
      />
    </div>
  );
}

export const VideoBlock: BuilderBlockDefinition = {
  type: "video",
  label: "Video",
  category: "Media",
  icon: "video",
  description: "A video file from the media library.",
  fields: [...VIDEO_FIELDS],
  defaults: fieldDefaults(VIDEO_FIELDS),
  component: VideoBlockComponent,
};
