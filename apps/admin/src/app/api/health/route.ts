import { NextResponse } from "next/server";

/** Liveness probe: answers without touching any upstream, so a slow backend never looks like a dead app. */
export const dynamic = "force-dynamic";

export function GET() {
  return new NextResponse("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
