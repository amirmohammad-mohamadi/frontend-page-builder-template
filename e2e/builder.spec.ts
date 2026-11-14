import { expect, test, type Page } from "@playwright/test";
import { openAdmin, signIn, WEB } from "./support/auth";

// The page builder end to end, in the bundled Core editor. The Studio SDK editor is not covered:
// it needs NEXT_PUBLIC_BUILDER_EDITOR=studio and the user's own licence key, which CI lacks.
// The tests share one page (`e2e/launch`) and run in order.
test.describe.configure({ mode: "serial" });

const SLUG = "e2e/launch";
const HERO_DEFAULT_TITLE = "Build pages visually";

/** The text box of the selected block's translatable "Title" trait. */
const titleTrait = (page: Page) =>
  page
    .locator(".gjs-trt-trait")
    .filter({ has: page.locator(".gjs-label", { hasText: /^Title$/ }) })
    .locator("input.pb-trait-input");

/** The editor canvas frame. */
const canvas = (page: Page) => page.frameLocator('[data-builder-slot="canvas"] iframe').first();

/** Switches the builder's editing language. */
async function setEditingLocale(page: Page, label: string): Promise<void> {
  await page.getByRole("combobox", { name: "Editing language" }).click();
  await page.getByRole("option", { name: label }).click();
}

/** Opens the actions menu of the test page's row and picks `action`. */
async function rowAction(page: Page, action: string): Promise<void> {
  await page
    .getByRole("row", { name: /Launch/ })
    .getByRole("button", { name: "Actions" })
    .click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

/** The HTTP status the web app answers for the test page in `locale`. */
const webStatus = (page: Page, locale = "en") =>
  page.request.get(`${WEB}/${locale}/${SLUG}`).then((response) => response.status());

test("the seeded page renders in both locales and an unknown slug is a 404", async ({ page }) => {
  await page.goto(`${WEB}/en/about`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About us");

  await page.goto(`${WEB}/fa/about`);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("درباره ما");

  const missing = await page.goto(`${WEB}/en/no-such-page`);
  expect(missing?.status()).toBe(404);
});

test("create a page, build it, save, publish and preview it", async ({ page, browser }) => {
  test.setTimeout(300_000);
  await openAdmin(page, "/pages");
  await expect(page.getByRole("row", { name: /About us/ })).toContainText("Published");

  await page.getByRole("button", { name: "New page" }).click();
  const dialog = page.getByRole("dialog", { name: "New page" });
  await dialog.getByLabel("Slug").fill(SLUG);
  await dialog.getByLabel("Title (English)").fill("Launch");
  await dialog.getByLabel("Title (فارسی)").fill("رونمایی");
  await dialog.getByRole("button", { name: "Create and open" }).click();
  await expect(page).toHaveURL(/\/builder\/[^/]+$/, { timeout: 90_000 });
  const builderUrl = page.url();

  // The blocks panel: 16 blocks in four categories.
  await expect(page.locator("button[data-block-id]")).toHaveCount(16, { timeout: 90_000 });
  for (const category of ["Layout", "Content", "Media", "Marketing"]) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${category}\\s*\\d+$`, "i") })
    ).toBeVisible();
  }

  // Click-to-add appends the block to the page and selects it; the hero goes last so it stays selected.
  await page.locator('button[data-block-id="faq"]').click();
  await page.locator('button[data-block-id="hero"]').click();
  await expect(canvas(page).getByRole("heading", { name: HERO_DEFAULT_TITLE })).toBeVisible();

  await page.getByRole("tab", { name: "Properties" }).click();
  await expect(titleTrait(page)).toBeVisible();
  await titleTrait(page).fill("Launch day");
  await titleTrait(page).press("Enter");
  await expect(canvas(page).getByRole("heading", { name: "Launch day" })).toBeVisible();

  await setEditingLocale(page, "فارسی");
  await expect(titleTrait(page)).not.toHaveValue("Launch day");
  await titleTrait(page).fill("روز رونمایی");
  await titleTrait(page).press("Enter");
  await expect(canvas(page).getByRole("heading", { name: "روز رونمایی" })).toBeVisible();

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();

  // Reload: both translations persisted.
  await page.goto(builderUrl);
  await expect(canvas(page).getByRole("heading", { name: "Launch day" })).toBeVisible({
    timeout: 90_000,
  });
  // Select the hero on the canvas (retried: a click can land while the frame is still settling).
  await page.getByRole("tab", { name: "Properties" }).click();
  await expect(async () => {
    await canvas(page).getByRole("heading", { name: "Launch day" }).click();
    await expect(titleTrait(page)).toHaveValue("Launch day", { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await setEditingLocale(page, "فارسی");
  await expect(titleTrait(page)).toHaveValue("روز رونمایی");
  await expect(canvas(page).getByRole("heading", { name: "روز رونمایی" })).toBeVisible();

  // Publish through the confirm dialog.
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Publish this page?" })
    .getByRole("button", { name: "Publish" })
    .click();
  await expect(page.getByText("Page published.")).toBeVisible();

  await page.goto(`${WEB}/en/${SLUG}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Launch day");
  await page.goto(`${WEB}/fa/${SLUG}`);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("روز رونمایی");

  // The draft preview: a fresh context has no session, so it is sent to sign-in first.
  const context = await browser.newContext();
  const visitor = await context.newPage();
  await visitor.goto(`${WEB}/en/preview/${SLUG}`);
  await expect(visitor).toHaveURL(/\/en\/login\?next=/);
  await signIn(visitor, "user@example.com", new RegExp(`/en/preview/${SLUG}$`));
  await expect(visitor.getByText("Draft preview, not public")).toBeVisible();
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("Launch day");
  await context.close();
});

test("unpublish, publish again and delete from the pages list", async ({ page }) => {
  await openAdmin(page, "/pages");
  const row = page.getByRole("row", { name: /Launch/ });
  await expect(row).toContainText("Published");

  await rowAction(page, "Unpublish");
  await page
    .getByRole("dialog", { name: "Unpublish this page?" })
    .getByRole("button", { name: "Unpublish" })
    .click();
  await expect(page.getByText("Page unpublished.")).toBeVisible();
  await expect(row).toContainText("Draft");
  await expect.poll(() => webStatus(page)).toBe(404);

  await rowAction(page, "Publish");
  await page
    .getByRole("dialog", { name: "Publish this page?" })
    .getByRole("button", { name: "Publish" })
    .click();
  await expect(row).toContainText("Published");
  await expect.poll(() => webStatus(page)).toBe(200);

  await rowAction(page, "Delete");
  await page
    .getByRole("dialog", { name: "Delete this page?" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText("Page deleted.")).toBeVisible();
  await expect(row).toHaveCount(0);
  await expect.poll(() => webStatus(page)).toBe(404);
  await expect.poll(() => webStatus(page, "fa")).toBe(404);
});
