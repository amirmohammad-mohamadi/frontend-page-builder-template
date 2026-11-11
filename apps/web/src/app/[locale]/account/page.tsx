import { setRequestLocale } from "next-intl/server";
import { AccountOverview } from "@/features/account/account-overview";

/** Protected by `proxy.ts` (`PROTECTED_PATHS`); the client component reads the session query. */
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountOverview />;
}
