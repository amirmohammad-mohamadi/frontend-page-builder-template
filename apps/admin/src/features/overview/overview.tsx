"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components";
import { useCurrentUser } from "@services";
// example-domain:start
import { Skeleton } from "@components";
import { useExamples } from "@services";
// example-domain:end
import { PageHeader } from "@/components/page-header";
import { TEXTS, fill } from "@/texts";

export function Overview() {
  const { user } = useCurrentUser();
  const t = TEXTS.overview;
  // example-domain:start
  const examples = useExamples({ per_page: 1 });
  // example-domain:end

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={user ? fill(t.welcome, { name: user.getDisplayName() }) : t.subtitle}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* example-domain:start */}
        <Card>
          <CardHeader>
            <CardDescription>{t.cards.examples}</CardDescription>
            <CardTitle className="text-3xl">
              {examples.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (examples.data?.getPaginate().getTotalItems() ?? "—")
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        {/* example-domain:end */}
        <Card>
          <CardHeader>
            <CardDescription>{t.cards.session}</CardDescription>
            <CardTitle className="truncate text-lg">{user?.getEmail() ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t.cards.permissions}</CardDescription>
            <CardTitle className="text-lg">
              {user?.getPermissions().length || t.cards.none}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            {user?.getRoles().join(", ")}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
