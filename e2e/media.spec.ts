import { expect, test, type Page } from "@playwright/test";
import { openAdmin, waitForHydration } from "./support/auth";

/** A valid 1×1 transparent PNG. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);
const NAME = "e2e-pixel.png";

/** The grid card of the file called `name`. */
const cardOf = (page: Page, name: string) =>
  page.locator("div.bg-card").filter({ has: page.getByTitle(name) });

/** Drops a generated PNG called `name` on the library's drop zone, as a dragged file would. */
async function dropPng(page: Page, name: string): Promise<void> {
  const dataTransfer = await page.evaluateHandle(
    ({ base64, fileName }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], fileName, { type: "image/png" }));
      return transfer;
    },
    { base64: PNG_1X1.toString("base64"), fileName: name }
  );
  await page
    .locator("div")
    .filter({ has: page.getByRole("button", { name: "choose files" }) })
    .last()
    .dispatchEvent("drop", { dataTransfer });
}

test("a file picked through the file input is uploaded", async ({ page }) => {
  test.setTimeout(240_000);
  const name = "e2e-picked.png";
  await openAdmin(page, "/media");
  await waitForHydration(page, 'input[type="file"]');
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: "image/png", buffer: PNG_1X1 });
  await expect(cardOf(page, name)).toBeVisible({ timeout: 15_000 });
});

test("upload, edit, search, copy and delete a media file", async ({ page }) => {
  test.setTimeout(240_000);
  await openAdmin(page, "/media");
  await waitForHydration(page, 'input[type="file"]');

  // Upload through the drop zone; the file input has its own test above.
  const card = cardOf(page, NAME);
  await dropPng(page, NAME);
  await expect(page.getByText(`${NAME} uploaded.`)).toBeVisible();
  await expect(card).toBeVisible();

  // Alternative texts per locale.
  await card.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit media" });
  await dialog.getByLabel("Alternative text (English)").fill("A single pixel");
  await dialog.getByLabel("Alternative text (فارسی)").fill("یک پیکسل");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Media updated.")).toBeVisible();
  await expect(card.getByRole("img", { name: "A single pixel" })).toBeVisible();

  // Search narrows the grid.
  const search = page.getByRole("textbox", { name: "Search media" });
  await search.fill("no-such-file-xyz");
  await expect(card).toHaveCount(0);
  await search.fill("e2e-pixel");
  await expect(card).toBeVisible();

  // Copy URL: headless Chromium may refuse clipboard access, so only the control is asserted.
  const copy = card.getByRole("button", { name: "Copy URL" });
  await expect(copy).toBeEnabled();
  await copy.click();

  await card.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("dialog", { name: "Delete this file?" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText("Media deleted.")).toBeVisible();
  await expect(page.getByTitle(NAME)).toHaveCount(0);
});
