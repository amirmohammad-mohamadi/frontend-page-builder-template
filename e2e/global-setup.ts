import { chromium, type Page } from "@playwright/test";
import { waitForHydration } from "./support/auth";

const WEB_ROUTES = [
  "/en",
  "/en/about",
  "/fa/about",
  "/en/examples",
  "/en/account",
  "/en/preview/about",
];
const ADMIN_ROUTES = ["/", "/pages", "/media", "/examples", "/settings", "/builder/1"];

/** Signs in on the login page at `url`; failures are left to the tests to report. */
async function signIn(page: Page, url: string, email: string): Promise<void> {
  await page.goto(url, { timeout: 180_000 });
  await waitForHydration(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((target) => !target.pathname.endsWith("/login"), { timeout: 180_000 });
}

/** Visits every route once, signed in, so each is compiled before a test needs it. */
async function warm(page: Page, origin: string, routes: string[]): Promise<void> {
  for (const route of routes) {
    await page.goto(`${origin}${route}`, { waitUntil: "load", timeout: 180_000 });
  }
}

/**
 * Warms the `next dev` servers before any test runs (Playwright starts the `webServer` entries
 * first). Each route compiles on its first visit, and a page whose code is still compiling
 * reloads itself, which detaches the elements a test is driving and made a cold first run fail.
 * Warm-up errors are swallowed: the tests report a real failure on their own.
 */
export default async function globalSetup(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const admin = await browser.newPage();
    await signIn(admin, "http://localhost:3001/login", "admin@example.com").catch(() => undefined);
    await warm(admin, "http://localhost:3001", ADMIN_ROUTES).catch(() => undefined);

    const web = await browser.newPage();
    await signIn(web, "http://localhost:3000/en/login", "user@example.com").catch(() => undefined);
    await warm(web, "http://localhost:3000", WEB_ROUTES).catch(() => undefined);
  } finally {
    await browser.close();
  }
}
