"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginDto } from "@dtos";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
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
import { describeApiError, useLogin } from "@services";
import { Link } from "@/i18n/navigation";
import { useAfterSignIn } from "./use-after-sign-in";

export function LoginForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const afterSignIn = useAfterSignIn();
  const login = useLogin({ onSuccess: afterSignIn });
  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("signInTitle")}</CardTitle>
        <CardDescription>{t("signInSubtitle")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => login.mutate(values))} noValidate>
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t("password")}</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground text-xs hover:underline"
                    >
                      {t("forgotLink")}
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
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
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">{t("remember")}</FormLabel>
                </FormItem>
              )}
            />
            <FormError error={describeApiError(login.error, common("somethingWentWrong"))} />
            <p className="text-muted-foreground text-xs" dir="ltr">
              {t("mockHint", { email: "user@example.com", password: "password" })}
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {t("submitSignIn")}
            </Button>
            <p className="text-muted-foreground text-sm">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-foreground underline">
                {t("signUpTitle")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
