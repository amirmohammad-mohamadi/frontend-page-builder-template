import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { TEXTS } from "@/texts";

export const metadata: Metadata = { title: TEXTS.auth.resetTitle };

/** The page a password-reset email links to: `/reset-password?token=…&email=…`. */
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
