"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordDto } from "@dtos";
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
} from "@components";
import { describeApiError, useForgotPassword } from "@services";
import { TEXTS } from "@/texts";

export function ForgotPasswordForm() {
  const t = TEXTS.auth;
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.forgotTitle}</CardTitle>
        <CardDescription>{t.forgotSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => forgot.mutate(values))}
            className="space-y-4"
            noValidate
          >
            {forgot.isSuccess ? (
              <p role="status" className="text-sm">
                {t.forgotSent}
              </p>
            ) : (
              <>
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
                <FormError
                  error={describeApiError(forgot.error, TEXTS.common.somethingWentWrong)}
                />
                <Button type="submit" className="w-full" disabled={forgot.isPending}>
                  {t.submitForgot}
                </Button>
              </>
            )}
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
