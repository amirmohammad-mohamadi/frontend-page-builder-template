import { expect, test } from "@playwright/test";

// Smoke tests of the `example` reference domain. `npm run example:remove` deletes this file.

const WEB = "http://localhost:3000";
const ADMIN = "http://localhost:3001";

test("web: examples list loads from the mock API", async ({ page }) => {
  await page.goto(`${WEB}/en/examples`);
  await expect(page.getByRole("list").getByRole("listitem").first()).toBeVisible();
});

test("admin: sign in, see the examples table, create and delete an entry", async ({ page }) => {
  await page.goto(`${ADMIN}/examples`);
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/examples$/);
  await expect(page.getByRole("table")).toBeVisible();

  await page.getByRole("button", { name: "New example" }).click();
  await page.getByLabel("Title").fill("Created by smoke test");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: "Created by smoke test" })).toBeVisible();

  const row = page.getByRole("row", { name: /Created by smoke test/ });
  await row.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("cell", { name: "Created by smoke test" })).toHaveCount(0);
});
