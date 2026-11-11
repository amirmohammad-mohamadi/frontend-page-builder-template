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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@components";
import { formatDate } from "@utils";
import { Link } from "@/i18n/navigation";
import { useExamplesList } from "./examples-list.hook";

export function ExamplesList() {
  const t = useTranslations("examples");
  const common = useTranslations("common");
  const locale = useLocale();
  const { query, page, status, search, setSearch, setStatus, setPage } = useExamplesList();
  const list = query.data;
  const paginate = list?.getPaginate();

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={common("search")}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48" aria-label={t("status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("statusAll")}</SelectItem>
            <SelectItem value="draft">{t("statusDraft")}</SelectItem>
            <SelectItem value="active">{t("statusActive")}</SelectItem>
            <SelectItem value="archived">{t("statusArchived")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="rounded-md border p-6 text-center">
          <p>{t("loadError")}</p>
          <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
            {common("retry")}
          </Button>
        </div>
      ) : !list || list.getItems().length === 0 ? (
        <p className="text-muted-foreground rounded-md border p-6 text-center">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.getItems().map((item) => (
            <li key={String(item.getId())}>
              <Link href={`/examples/${item.getId()}`} className="block h-full">
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item.getTitle()}</CardTitle>
                      <Badge variant={item.isActive() ? "default" : "secondary"}>
                        {t(`status${capitalize(item.getStatus())}`)}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {item.getDescription()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-xs">
                    {t("created")}: {formatDate(item.getCreatedAt(), locale)}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {paginate && paginate.getLastPage() > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Pagination">
          <Button
            variant="outline"
            disabled={!paginate.getHasPreviousPage()}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </Button>
          <span className="text-muted-foreground text-sm">
            {t("pageOf", { page: paginate.getCurrentPage(), total: paginate.getLastPage() })}
          </span>
          <Button
            variant="outline"
            disabled={!paginate.getHasNextPage()}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

function capitalize(value: string): "Draft" | "Active" | "Archived" {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as "Draft" | "Active" | "Archived";
}
