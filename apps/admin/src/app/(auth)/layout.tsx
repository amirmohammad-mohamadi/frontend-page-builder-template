import { Logo } from "@assets";
import { TEXTS } from "@/texts";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="size-6" />
        {TEXTS.appName}
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
