import { expect, test } from "@playwright/test";

test.describe("Model Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays a model button", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await expect(modelButton).toBeVisible();
  });

  test("opens model selector popover on click", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    await expect(page.getByPlaceholder("Search models...")).toBeVisible();
  });

  test("can search for models", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    const searchInput = page.getByPlaceholder("Search models...");
    await searchInput.fill("Hyper");

    await expect(page.getByRole("option", { name: /HyperLite/ })).toBeVisible();
  });

  test("can close model selector by clicking outside", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    await expect(page.getByPlaceholder("Search models...")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByPlaceholder("Search models...")).not.toBeVisible();
  });

  test("shows available models", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    const availableModels = page.getByRole("group", { name: "Available" });
    await expect(availableModels).toBeVisible();
    await expect(
      availableModels.getByRole("option", { name: /HyperMax/ })
    ).toBeVisible();
    await expect(
      availableModels.getByRole("option", { name: /HyperMix/ })
    ).toBeVisible();
  });

  test("can select a different model", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    await page.getByRole("option", { name: /HyperMax/ }).click();

    await expect(page.getByPlaceholder("Search models...")).not.toBeVisible();
    await expect(modelButton).toContainText("HyperMax");
  });
});
