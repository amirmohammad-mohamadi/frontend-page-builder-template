"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@components";
import { useExample } from "@services";
import { formatDate } from "@utils";
import { Link } from "@/i18n/navigation";

export function ExampleDetail({ id }: { id: string }) {
  const t = useTranslations("examples");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useExample(id);

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/examples">← {common("back")}</Link>
      </Button>

      {query.isPending ? (
        <Skeleton className="h-40 w-full" aria-busy="true" />
      ) : query.isError ? (
        <div role="alert" className="rounded-md border p-6 text-center">
          <p>{query.error.statusCode === 404 ? t("notFound") : t("loadError")}</p>
          {query.error.statusCode !== 404 ? (
            <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
              {common("retry")}
            </Button>
          ) : null}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{query.data.getTitle()}</CardTitle>
              <Badge variant={query.data.isActive() ? "default" : "secondary"}>
                {query.data.getStatus()}
              </Badge>
            </div>
            <CardDescription>
              {t("created")}: {formatDate(query.data.getCreatedAt(), locale)}
            </CardDescription>
          </CardHeader>
          <CardContent className="whitespace-pre-line">
            {query.data.getDescription() || common("noResults")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
