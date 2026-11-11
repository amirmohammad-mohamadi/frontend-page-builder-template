//@ts-check
const path = require("path");
const { composePlugins, withNx } = require("@nx/next");

// next-intl's request config, wired for both bundlers by hand: Turbopack wants
// a project-relative specifier, webpack an absolute path, and the official
// plugin picks its branch from an env var Nx has not set yet when this file
// is evaluated.
const i18nRequestPath = "./src/i18n/request.ts";
const i18nRequestAbsolute = path.join(__dirname, i18nRequestPath).replace(/\\/g, "/");

/** @param {import('@nx/next/plugins/with-nx').WithNxOptions} nextConfig */
function withNextIntl(nextConfig) {
  const originalWebpack = nextConfig.webpack;
  return {
    ...nextConfig,
    turbopack: {
      ...nextConfig.turbopack,
      resolveAlias: { ...nextConfig.turbopack?.resolveAlias, "next-intl/config": i18nRequestPath },
    },
    webpack(config, options) {
      config.resolve.alias["next-intl/config"] = i18nRequestAbsolute;
      return typeof originalWebpack === "function" ? originalWebpack(config, options) : config;
    },
  };
}

// The backend origin the browser calls directly for public endpoints; it must
// be allowed by connect-src. Read here, not through env.ts, because this file
// runs in Node before the app code is bundled.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").origin;
  } catch {
    return null;
  }
})();

/**
 * Content Security Policy, report-only so it can never break a page: the
 * browser reports violations to the console (and to `report-to` once a
 * project adds an endpoint). Promote it to `Content-Security-Policy` once the
 * project's own scripts, styles and image hosts are listed. HSTS belongs on
 * the TLS terminator, not here.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  ["connect-src 'self'", apiOrigin].filter(Boolean).join(" "),
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const nextConfig = {
  nx: {},
  transpilePackages: ["utils", "components", "assets", "services", "models", "dtos", "enums"],
  output: "standalone",
  images: {
    // Add the hosts the project serves images from.
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
};

module.exports = composePlugins(withNx, withNextIntl)(nextConfig);
