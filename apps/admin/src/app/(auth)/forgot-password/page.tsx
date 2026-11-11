import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { TEXTS } from "@/texts";

export const metadata: Metadata = { title: TEXTS.auth.forgotTitle };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
