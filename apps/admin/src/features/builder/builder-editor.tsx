"use client";

import dynamic from "next/dynamic";
import { InfoIcon } from "lucide-react";
import type { PageModel } from "@models";
import { DEFAULT_CONTENT_LOCALE } from "@/config/locale";
import { TEXTS } from "@/texts";
import { useBuilderEditor } from "./builder-editor.hook";
import { BuilderToolbar } from "./builder-toolbar";
import type { EditorKind } from "./editor-kind";
import { EditorShell } from "./editor-shell";
import { PublishConfirmDialog } from "./publish-confirm-dialog";

// The Studio SDK is loaded only when the host is mounted, so a Core-only deployment never ships it.
const StudioHost = dynamic(() => import("./studio-host").then((m) => m.StudioHost), {
  ssr: false,
});

type Props = {
  page: PageModel;
  kind: EditorKind;
  /** Shown when `studio` was configured but could not be mounted here. */
  notice: boolean;
};

/**
 * One page in the builder: the shared toolbar over either editor shell, the publish
 * confirmation, and the load/save/publish wiring of `useBuilderEditor`.
 */
export function BuilderEditor({ page, kind, notice }: Props) {
  const vm = useBuilderEditor({ page, kind });
  const slug = page.getSlug();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BuilderToolbar
        title={page.getTitle(vm.editingLocale, DEFAULT_CONTENT_LOCALE) || TEXTS.pages.untitled}
        slug={slug}
        status={page.getStatus()}
        dirty={vm.dirty}
        ready={vm.loaded}
        editingLocale={vm.editingLocale}
        onEditingLocaleChange={vm.setEditingLocale}
        onSave={() => void vm.saveDraft()}
        onPublish={() => vm.setPublishOpen(true)}
        onPreview={vm.openPreview}
        isSaving={vm.isSaving}
        isPublishing={vm.isPublishing}
      />
      {notice ? (
        <p
          role="status"
          className="bg-muted text-muted-foreground flex shrink-0 items-center gap-2 border-b px-3 py-1.5 text-xs"
        >
          <InfoIcon className="size-3.5 shrink-0" aria-hidden />
          {TEXTS.builder.studioNotice}
        </p>
      ) : null}
      {kind === "studio" ? (
        <StudioHost page={page} onEditor={vm.handleEditor} onSave={vm.saveDraft} />
      ) : (
        <EditorShell onEditor={vm.handleEditor} />
      )}
      <PublishConfirmDialog
        open={vm.publishOpen}
        onOpenChange={vm.setPublishOpen}
        slug={slug}
        dirty={vm.dirty}
        onConfirm={() => void vm.confirmPublish()}
        isPending={vm.isPublishing || vm.isSaving}
      />
    </div>
  );
}
