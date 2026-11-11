"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginDto } from "@dtos";
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
import { describeApiError, useLogin } from "@services";
import { getSafeNextPath } from "@utils";
import { TEXTS } from "@/texts";

export function LoginForm() {
  const t = TEXTS.auth;
  const searchParams = useSearchParams();
  const login = useLogin({
    // A full navigation: the middleware re-evaluates the fresh cookies and the shell mounts clean.
    onSuccess: () =>
      window.location.assign(getSafeNextPath(searchParams.get("next"), window.location.origin)),
  });
  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.signInTitle}</CardTitle>
        <CardDescription>{t.signInSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t.password}</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground text-xs hover:underline"
                    >
                      {t.forgotLink}
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      showLabel={t.showPassword}
                      hideLabel={t.hidePassword}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormError error={describeApiError(login.error, TEXTS.common.somethingWentWrong)} />
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {t.submit}
            </Button>
            <p className="text-muted-foreground text-center text-xs">{t.mockHint}</p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
