import { expect, test } from "@playwright/test";

test("renders planner and default controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Weather Planner" })).toBeVisible();
  await expect(page.getByLabel("Location")).toHaveValue(/San Francisco, CA/i);
  await expect(page.getByRole("combobox").first()).toHaveValue("fri");
  await expect(page.getByRole("combobox").nth(1)).toHaveValue("afternoon");
});
