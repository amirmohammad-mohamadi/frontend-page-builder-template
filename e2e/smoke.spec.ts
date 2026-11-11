import { expect, test } from "@playwright/test";

const WEB = "http://localhost:3000";
const ADMIN = "http://localhost:3001";

test.describe("web", () => {
  test("home renders in the default locale and in the RTL locale", async ({ page }) => {
    await page.goto(`${WEB}/en`);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto(`${WEB}/fa`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  });

  test("a protected page redirects to sign-in, and signing in opens it", async ({ page }) => {
    await page.goto(`${WEB}/en/account`);
    await expect(page).toHaveURL(/\/en\/login\?next=/);
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/account$/);
    await expect(page.getByText("user@example.com")).toBeVisible();
  });

  test("the reset-password link sets a new password and signs the user in", async ({ page }) => {
    await page.goto(`${WEB}/en/reset-password?token=mock-reset-token&email=user%40example.com`);
    await expect(page.getByLabel("Email")).toHaveValue("user@example.com");
    // The mock accepts the same password again, which keeps the other tests' credentials valid.
    await page.getByLabel("New password", { exact: true }).fill("password");
    await page.getByLabel("Confirm password").fill("password");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page).toHaveURL(/\/en\/account$/);
  });

  test("the proxy refuses a path outside its allow-list, encoded or not", async ({ request }) => {
    for (const path of [
      "api/v1/admin/me",
      "api/v1/examples/..%2fadmin/me",
      "api/v1/examples/%2e%2e/admin/me",
    ]) {
      const response = await request.get(`${WEB}/api/backend/${path}`);
      expect(response.status(), path).toBe(404);
    }
  });
});

test.describe("admin", () => {
  test("sign in and reach the overview", async ({ page }) => {
    await page.goto(`${ADMIN}/settings`);
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
