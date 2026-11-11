import {
  CircleCheck,
  Globe,
  Heart,
  Layers,
  MessageCircle,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";
import type { FieldSelectOption } from "../../fields/types";

/**
 * The small lucide set a feature card can pick from, by the kebab-case name
 * the lucide site uses. Imported one by one so a page pays only for these.
 */
export const BLOCK_ICONS: Readonly<Record<string, ComponentType<LucideProps>>> = {
  sparkles: Sparkles,
  zap: Zap,
  "shield-check": ShieldCheck,
  heart: Heart,
  star: Star,
  globe: Globe,
  rocket: Rocket,
  "circle-check": CircleCheck,
  layers: Layers,
  settings: Settings,
  users: Users,
  "message-circle": MessageCircle,
};

/** The icon choices as select options, labelled in title case. */
export const BLOCK_ICON_OPTIONS: FieldSelectOption[] = Object.keys(BLOCK_ICONS).map((id) => ({
  id,
  label: id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
}));
