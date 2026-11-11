"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type ThemeToggleLabels = { theme: string; light: string; dark: string; system: string };

/** Light / dark / system switch over next-themes. Labels arrive translated from the app. */
export function ThemeToggle({ labels }: { labels: ThemeToggleLabels }) {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.theme}>
          <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setTheme("light")}>{labels.light}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>{labels.dark}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}>{labels.system}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
