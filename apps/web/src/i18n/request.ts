// No imports from "next-intl/server" here: in the react-server context
// `getRequestConfig` is an identity function, and importing it through the
// bundler alias in next.config.js breaks the server/client boundary. The
// config function is exported directly instead.
import { isAppLocale } from "./locales";
import { routing } from "./routing";

export default async function requestConfig({
  requestLocale,
}: {
  requestLocale: Promise<string | undefined>;
}) {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`, { with: { type: "json" } }))
    .default;
  return { locale, messages };
}
