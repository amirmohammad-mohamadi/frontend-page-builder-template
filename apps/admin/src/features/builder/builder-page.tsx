"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { Button } from "@components";
import { TEXTS } from "@/texts";
import { BuilderEditor } from "./builder-editor";
import { useBuilderPage } from "./builder-page.hook";

/** The editor route's client body: loading, error and not-found states around the editor. */
export function BuilderPage({ id }: { id: string }) {
  const t = TEXTS.builder;
  const vm = useBuilderPage(id);

  if (vm.query.isPending) return <BuilderLoading />;

  if (vm.notFound) {
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">{t.notFoundTitle}</h1>
        <p className="text-muted-foreground mt-2">{t.notFoundBody}</p>
        <Button className="mt-6" asChild>
          <Link href="/pages">{t.backToPages}</Link>
        </Button>
      </Centered>
    );
  }

  if (vm.query.isError || !vm.query.data) {
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">{t.loadError}</h1>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => vm.query.refetch()}>{TEXTS.common.retry}</Button>
          <Button variant="outline" asChild>
            <Link href="/pages">{t.backToPages}</Link>
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <BuilderEditor
      key={String(vm.query.data.getId())}
      page={vm.query.data}
      kind={vm.editorKind}
      notice={vm.studioNotice}
    />
  );
}

/** The full-screen spinner shown while the page or the editor bundle loads. */
export function BuilderLoading() {
  return (
    <Centered role="status" aria-live="polite">
      <Loader2Icon className="text-muted-foreground size-6 animate-spin" aria-hidden />
      <p className="text-muted-foreground mt-3 text-sm">{TEXTS.builder.loading}</p>
    </Centered>
  );
}

function Centered({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      {...props}
      className="bg-background flex min-h-dvh flex-col items-center justify-center p-6 text-center"
    >
      {children}
    </div>
  );
}
