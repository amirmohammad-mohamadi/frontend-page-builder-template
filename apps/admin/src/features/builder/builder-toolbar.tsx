"use client";

import { ArrowLeftIcon, ExternalLinkIcon, SaveIcon, UploadCloudIcon } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@components";
import { CONTENT_LOCALE_LABELS, type ContentLocale } from "@/config/locale";
import { EDITING_LOCALES } from "@/grapesjs/editor/editing-locale";
import { TEXTS } from "@/texts";

type Props = {
  title: string;
  slug: string;
  status: "draft" | "published";
  dirty: boolean;
  editingLocale: ContentLocale;
  onEditingLocaleChange: (locale: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  /** Whether the editor is ready; the actions wait for it. */
  ready: boolean;
};

/**
 * The builder's top bar: back to the pages list, the page's title and slug, the
 * editing-locale switcher, the unsaved-changes indicator and the Save draft, Publish and
 * Preview actions. Shared by the Core shell and the Studio host.
 */
export function BuilderToolbar(props: Props) {
  const t = TEXTS.builder;
  const busy = props.isSaving || props.isPublishing;

  return (
    <header className="bg-background flex h-12 shrink-0 items-center gap-2 border-b px-2">
      <Button size="sm" variant="ghost" asChild>
        <Link
          href="/pages"
          aria-label={t.backToPages}
          title={t.backToPages}
          onClick={(event) => {
            // In-app navigation skips `beforeunload`, so unsaved changes are confirmed here.
            if (props.dirty && !window.confirm(t.leaveConfirm)) event.preventDefault();
          }}
        >
          <ArrowLeftIcon className="rtl:rotate-180" />
          <span className="hidden lg:inline">{t.backToPages}</span>
        </Link>
      </Button>
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium" dir="auto">
          {props.title}
        </span>
        <span className="text-muted-foreground hidden truncate font-mono text-xs md:inline">
          /{props.slug}
        </span>
        <Badge variant={props.status === "published" ? "default" : "secondary"}>
          {TEXTS.pages.statuses[props.status]}
        </Badge>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <span
          className="text-muted-foreground hidden text-xs sm:inline"
          role="status"
          aria-live="polite"
        >
          {props.dirty ? t.unsavedChanges : props.ready ? t.saved : ""}
        </span>
        <Select value={props.editingLocale} onValueChange={props.onEditingLocaleChange}>
          <SelectTrigger size="sm" aria-label={t.editingLocale} className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITING_LOCALES.map((locale) => (
              <SelectItem key={locale} value={locale}>
                {CONTENT_LOCALE_LABELS[locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={props.onPreview} disabled={!props.ready}>
          <ExternalLinkIcon />
          <span className="hidden lg:inline">{t.preview}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={props.onSave}
          disabled={!props.ready || busy || !props.dirty}
        >
          <SaveIcon />
          {props.isSaving ? t.saving : t.saveDraft}
        </Button>
        <Button size="sm" onClick={props.onPublish} disabled={!props.ready || busy}>
          <UploadCloudIcon />
          {props.isPublishing ? t.publishing : t.publish}
        </Button>
      </div>
    </header>
  );
}
