import { expect, type Page } from "@playwright/test";

export const WEB = "http://localhost:3000";
export const ADMIN = "http://localhost:3001";

/**
 * Waits until React has hydrated the element `selector` matches (the page's form by default). On a `next dev` cold start the HTML arrives
 * long before the client bundle, and a form submitted in between falls back to a native GET
 * (credentials in the URL, no sign-in). `networkidle` is no help: the admin app keeps a
 * connection open.
 *
 * @param page the page showing the element
 * @param selector a CSS selector of an element React renders
 */
export async function waitForHydration(page: Page, selector = "form"): Promise<void> {
  await page.waitForFunction(
    (target) => {
      const element = document.querySelector(target);
      return Boolean(element && Object.keys(element).some((key) => key.startsWith("__react")));
    },
    selector,
    { timeout: 90_000 }
  );
}

/**
 * Fills the sign-in form the page shows and waits for the URL it lands on.
 *
 * @param page the page showing the sign-in form
 * @param email the mock account (the password is always `password`)
 * @param next the URL expected after signing in
 */
export async function signIn(page: Page, email: string, next: RegExp): Promise<void> {
  await waitForHydration(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(next);
}

/**
 * Opens an admin path, signing in as the admin account on the way.
 *
 * @param page the page to drive
 * @param path the admin path, e.g. `/pages`
 */
export async function openAdmin(page: Page, path: string): Promise<void> {
  const target = new RegExp(`${path.replace(/\//g, "\\/")}$`);
  // Retried as a whole: while `next dev` is still compiling, a page can reload under the form.
  await expect(async () => {
    await page.goto(`${ADMIN}${path}`);
    if (target.test(page.url())) return;
    await waitForHydration(page);
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Sign in" }).click({ timeout: 10_000 });
    await expect(page).toHaveURL(target, { timeout: 15_000 });
  }).toPass({ timeout: 150_000 });
}
