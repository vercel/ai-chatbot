import { test, expect } from '@playwright/test';
import { getUnixTime } from 'date-fns';

const testEmail = `auth-${getUnixTime(new Date())}@playwright.com`;
const testPassword = process.env.TEST_USER_PASSWORD!;

test.describe('authentication', () => {
  test('redirect to login page when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText('Sign In');
  });

  test('register a test account', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading')).toContainText('Sign Up');
    await page.getByPlaceholder('user@acme.com').click();
    await page.getByPlaceholder('user@acme.com').fill(testEmail);
    await page.getByLabel('Password').click();
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('status')).toContainText(
      'Account created successfully',
    );
  });

  // test("register test account with existing email", async ({ page }) => {
  //   await page.goto("/register");
  //   await expect(page.getByRole("heading")).toContainText("Sign Up");
  //   await page.getByPlaceholder("user@acme.com").click();
  //   await page.getByPlaceholder("user@acme.com").fill(testEmail);
  //   await page.getByLabel("Password").click();
  //   await page.getByLabel("Password").fill(testPassword);
  //   await page.getByRole("button", { name: "Sign Up" }).click();
  //   await expect(page.locator("li")).toContainText("Account already exists");
  // });

  // test("log into account", async ({ page }) => {
  //   await page.goto("/login");
  //   await expect(page.getByRole("heading")).toContainText("Sign In");
  //   await page.getByPlaceholder("user@acme.com").click();
  //   await page.getByPlaceholder("user@acme.com").fill(testEmail);
  //   await page.getByLabel("Password").click();
  //   await page.getByLabel("Password").fill(testPassword);
  //   await page.getByRole("button", { name: "Sign in" }).click();
  //   await page.waitForURL("/");
  //   await expect(page).toHaveURL("/");
  //   await expect(page.getByPlaceholder("Send a message...")).toBeVisible();
  // });
});
