"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { resetPasswordSchema, type ResetPasswordDto } from "@dtos";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
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
import { TEXTS } from "@/texts";

/** Step two of the password reset; a successful reset signs the operator in. */
export function ResetPasswordForm() {
  const t = TEXTS.auth;
  const searchParams = useSearchParams();
  const reset = useResetPassword({ onSuccess: () => window.location.assign("/") });
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
              showLabel={t.showPassword}
              hideLabel={t.hidePassword}
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
        <CardTitle>{t.resetTitle}</CardTitle>
        <CardDescription>{t.resetSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => reset.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.email}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="username" {...field} />
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
                  <FormLabel>{t.resetToken}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {passwordField("password", t.newPassword)}
            {passwordField("password_confirmation", t.passwordConfirmation)}
            <FormError error={describeApiError(reset.error, TEXTS.common.somethingWentWrong)} />
            <Button type="submit" className="w-full" disabled={reset.isPending}>
              {t.submitReset}
            </Button>
            <Link
              href="/login"
              className="text-muted-foreground block text-center text-sm underline"
            >
              {t.backToSignIn}
            </Link>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
