import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("can register a new account", async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = "testpassword123";

    await page.goto("/register");
    await page.getByPlaceholder("user@acme.com").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page.getByTestId("toast")).toContainText(
      "Account created successfully"
    );
    await expect(page).toHaveURL("/");
  });

  test("can login with credentials", async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = "testpassword123";

    await page.goto("/register");
    await page.getByPlaceholder("user@acme.com").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await page.getByPlaceholder("user@acme.com").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("user@acme.com").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByTestId("toast")).toBeVisible();
  });

  test("can continue as guest", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });
});

