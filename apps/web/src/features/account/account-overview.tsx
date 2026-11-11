"use client";

import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@components";
import { useCurrentUser } from "@services";
import { Link } from "@/i18n/navigation";

export function AccountOverview() {
  const t = useTranslations("account");
  const nav = useTranslations("nav");
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    // The middleware keeps signed-out visitors away from this page; a session
    // that ended mid-visit (sign-out, expiry) lands here and gets a link back.
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <Button asChild>
          <Link href="/login">{nav("signIn")}</Link>
        </Button>
      </div>
    );
  }

  const rows: [string, string][] = [
    [t("name"), user.getName() || t("none")],
    [t("email"), user.getEmail() || t("none")],
    [t("roles"), user.getRoles().join(", ") || t("none")],
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
