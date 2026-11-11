"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from "@components";
import { useCurrentUser, useLogout } from "@services";
import { Link, useRouter } from "@/i18n/navigation";

/** Sign-in link when signed out; avatar menu with account and sign-out when signed in. */
export function UserMenu() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout({
    onSuccess: () => {
      toast.success(t("auth.signedOut"));
      router.push("/");
    },
  });

  if (isLoading) return <Skeleton className="size-8 rounded-full" />;

  if (!user) {
    return (
      <Button size="sm" asChild>
        <Link href="/login">{t("nav.signIn")}</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("nav.account")}>
          <Avatar className="size-8">
            <AvatarFallback>{user.getInitials() || "?"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{user.getDisplayName()}</div>
          <div className="text-muted-foreground truncate text-xs">{user.getEmail()}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">{t("nav.account")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          {t("nav.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
