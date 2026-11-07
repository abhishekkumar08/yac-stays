import { expect, test } from "@playwright/test";
import { addDays, todayIso } from "../shared/dates.js";

const PASSWORD = "stays-demo-1";

async function signIn(page, email) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByLabel("Password").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Log in" }).click();
  await expect(dialog).toBeHidden();
}

async function pickDay(page, iso) {
  const day = page.locator(`[data-date="${iso}"]`).first();
  for (let i = 0; i < 4 && !(await day.isVisible()); i++) await page.getByRole("button", { name: "Next month" }).click();
  await day.click();
}

test("guest searches Goa, books a stay and sees it in Trips", async ({ page }) => {
  const checkIn = addDays(todayIso(), 21);
  const checkOut = addDays(checkIn, 3);

  await page.goto("/");
  await page.getByRole("button", { name: /^Where/ }).click();
  await page.getByRole("textbox", { name: "Where" }).fill("Goa");
  await page.getByRole("textbox", { name: "Where" }).press("Enter");
  await pickDay(page, checkIn);
  await pickDay(page, checkOut);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/s/Goa/homes\\?checkin=${checkIn}&checkout=${checkOut}`));

  await page.locator('article a[href^="/rooms/"]').first().click();
  await expect(page).toHaveURL(/\/rooms\/\d+/);
  const reserve = page.getByRole("button", { name: /^(Reserve|Request to book)$/ });
  await expect(reserve).toBeVisible();
  const title = await page.getByRole("heading", { level: 1 }).textContent();
  await reserve.click();

  await expect(page).toHaveURL(/\/book\/\d+/);
  await signIn(page, "guest@stays.test");
  await page.getByRole("textbox", { name: "Message the host" }).fill("Looking forward to the stay.");
  await page.getByRole("button", { name: /^(Confirm and pay|Request to book)$/ }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("host accepts a pending request and it leaves the list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Main navigation menu" }).click();
  await page.getByRole("menuitem", { name: "Log in or sign up" }).click();
  await signIn(page, "host@stays.test");

  await page.goto("/host");
  const requests = page.locator("section", { has: page.getByRole("heading", { name: "Booking requests" }) }).getByRole("listitem");
  await expect(requests.first()).toBeVisible();
  const before = await requests.count();
  const guest = await requests.first().locator("p").first().textContent();

  await requests.first().getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("Request accepted")).toBeVisible();
  await expect(requests).toHaveCount(before - 1);
  await expect(requests.filter({ hasText: guest })).toHaveCount(0);
});

test("guest books a service offering at a time slot", async ({ page }) => {
  await page.goto("/services");
  await page.getByRole("button", { name: "Main navigation menu" }).click();
  await page.getByRole("menuitem", { name: "Log in or sign up" }).click();
  await signIn(page, "guest@stays.test");

  await page.locator('article a[href^="/services/"]').first().click();
  await expect(page).toHaveURL(/\/services\/\d+/);
  const offering = page.getByRole("button").filter({ hasText: "/ guest ·" }).first();
  const offeringTitle = (await offering.locator("span span").first().textContent()).trim();
  await offering.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button").filter({ hasText: "left" }).first().click();
  await dialog.getByRole("button", { name: "Confirm and pay" }).click();
  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("link", { name: new RegExp(offeringTitle) })).toBeVisible();
});
