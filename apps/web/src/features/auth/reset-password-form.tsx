"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { resetPasswordSchema, type ResetPasswordDto } from "@dtos";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormError,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
} from "@components";
import { describeApiError, useResetPassword } from "@services";
import { Link } from "@/i18n/navigation";
import { useAfterSignIn } from "./use-after-sign-in";

/** Step two of the password reset: token and email come from the link, the user types the new password. */
export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const searchParams = useSearchParams();
  const afterSignIn = useAfterSignIn();
  const reset = useResetPassword({ onSuccess: afterSignIn });
  const form = useForm<ResetPasswordDto>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
      email: searchParams.get("email") ?? "",
      password: "",
      password_confirmation: "",
    },
  });

  const passwordField = (name: "password" | "password_confirmation", label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <PasswordInput
              autoComplete="new-password"
              dir="ltr"
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("resetTitle")}</CardTitle>
        <CardDescription>{t("resetSubtitle")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => reset.mutate(values))} noValidate>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem className={field.value ? "hidden" : undefined}>
                  <FormLabel>{t("resetToken")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {passwordField("password", t("newPassword"))}
            {passwordField("password_confirmation", t("passwordConfirmation"))}
            <FormError error={describeApiError(reset.error, common("somethingWentWrong"))} />
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={reset.isPending}>
              {t("submitReset")}
            </Button>
            <Link href="/login" className="text-muted-foreground text-sm underline">
              {t("signInTitle")}
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
