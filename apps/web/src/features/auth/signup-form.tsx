"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterDto } from "@dtos";
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
import { describeApiError, useRegister } from "@services";
import { Link } from "@/i18n/navigation";
import { useAfterSignIn } from "./use-after-sign-in";

export function SignupForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const afterSignIn = useAfterSignIn();
  const register = useRegister({ onSuccess: afterSignIn });
  const form = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" },
  });

  const passwordField = (
    name: "password" | "password_confirmation",
    label: string,
    autoComplete: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <PasswordInput
              autoComplete={autoComplete}
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
        <CardTitle>{t("signUpTitle")}</CardTitle>
        <CardDescription>{t("signUpSubtitle")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => register.mutate(values))} noValidate>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            {passwordField("password", t("password"), "new-password")}
            {passwordField("password_confirmation", t("passwordConfirmation"), "new-password")}
            <FormError error={describeApiError(register.error, common("somethingWentWrong"))} />
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {t("submitSignUp")}
            </Button>
            <p className="text-muted-foreground text-sm">
              {t("haveAccount")}{" "}
              <Link href="/login" className="text-foreground underline">
                {t("signInTitle")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
