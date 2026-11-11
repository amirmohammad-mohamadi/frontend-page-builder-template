import { NextResponse } from "next/server";
import { authServer } from "@/lib/auth/server";

export const POST =
  authServer.handlers.register ??
  (() => NextResponse.json({ message: "Registration is not enabled." }, { status: 404 }));
