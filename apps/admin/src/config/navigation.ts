import { LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react";
// example-domain:start
import { ListIcon } from "lucide-react";
// example-domain:end
import { TEXTS } from "@/texts";

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  /** Nested entries render as a collapsible group. */
  items?: { title: string; url: string }[];
};

/** The sidebar. Access per entry comes from `ROUTE_PERMISSIONS` in lib/permissions.ts, keyed by `url`. */
export const NAV_MAIN: NavItem[] = [
  { title: TEXTS.nav.overview, url: "/", icon: LayoutDashboardIcon },
  // example-domain:start
  { title: TEXTS.nav.examples, url: "/examples", icon: ListIcon },
  // example-domain:end
];

export const NAV_SECONDARY: NavItem[] = [
  { title: TEXTS.nav.settings, url: "/settings", icon: SettingsIcon },
];
