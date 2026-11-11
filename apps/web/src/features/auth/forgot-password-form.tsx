"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordDto } from "@dtos";
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
} from "@components";
import { describeApiError, useForgotPassword } from "@services";
import { Link } from "@/i18n/navigation";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forgotTitle")}</CardTitle>
        <CardDescription>{t("forgotSubtitle")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => forgot.mutate(values))} noValidate>
          <CardContent className="space-y-4">
            {forgot.isSuccess ? (
              <p role="status" className="text-sm">
                {t("forgotSent")}
              </p>
            ) : (
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
            )}
            <FormError error={describeApiError(forgot.error, common("somethingWentWrong"))} />
          </CardContent>
          <CardFooter className="flex-col gap-3">
            {!forgot.isSuccess ? (
              <Button type="submit" className="w-full" disabled={forgot.isPending}>
                {t("submitForgot")}
              </Button>
            ) : null}
            <Link href="/login" className="text-muted-foreground text-sm underline">
              {common("back")}
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
