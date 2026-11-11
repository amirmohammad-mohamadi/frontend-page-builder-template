import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";
import { TEXTS } from "@/texts";

export const metadata: Metadata = { title: TEXTS.auth.signInTitle };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
