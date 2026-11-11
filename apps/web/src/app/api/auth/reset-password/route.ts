import { NextResponse } from "next/server";
import { authServer } from "@/lib/auth/server";

export const POST =
  authServer.handlers.resetPassword ??
  (() => NextResponse.json({ message: "Password reset is not enabled." }, { status: 404 }));
