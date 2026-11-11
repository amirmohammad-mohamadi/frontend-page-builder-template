import Link from "next/link";
import { Button } from "@components";
import { TEXTS } from "@/texts";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <p className="text-muted-foreground text-sm">404</p>
      <h1 className="mt-1 text-2xl font-semibold">{TEXTS.common.notFoundTitle}</h1>
      <p className="text-muted-foreground mt-2">{TEXTS.common.notFoundBody}</p>
      <Button className="mt-6" asChild>
        <Link href="/">{TEXTS.common.goHome}</Link>
      </Button>
    </div>
  );
}
