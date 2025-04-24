import { expect, test } from '../fixtures';

test.describe
  .serial('session', () => {
    test('Authenticate as guest user when a new session is loaded', async ({
      page,
    }) => {
      const response = await page.goto('/');

      if (!response) {
        throw new Error('Failed to load page');
      }

      let request = response.request();

      const chain = [];

      while (request) {
        chain.unshift(request.url());
        request = request.redirectedFrom();
      }

      expect(chain).toEqual([
        'http://localhost:3000/',
        'http://localhost:3000/api/auth/guest?redirectUrl=http%3A%2F%2Flocalhost%3A3000%2F',
        'http://localhost:3000/',
      ]);
    });

    test('Log out is not available for guest users', async ({ page }) => {
      await page.goto('/');

      const sidebarToggleButton = page.getByTestId('sidebar-toggle-button');
      await sidebarToggleButton.click();

      const userNavButton = page.getByTestId('user-nav-button');
      await expect(userNavButton).toBeVisible();

      await userNavButton.click();
      const userNavMenu = page.getByTestId('user-nav-menu');
      await expect(userNavMenu).toBeVisible();

      const authMenuItem = page.getByTestId('user-nav-item-auth');
      await expect(authMenuItem).toContainText('Login to your account');
    });

    test('Log out is available for non-guest users', async ({ adaContext }) => {
      await adaContext.page.goto('/');

      const sidebarToggleButton = adaContext.page.getByTestId(
        'sidebar-toggle-button',
      );
      await sidebarToggleButton.click();

      const userNavButton = adaContext.page.getByTestId('user-nav-button');
      await expect(userNavButton).toBeVisible();

      await userNavButton.click();
      const userNavMenu = adaContext.page.getByTestId('user-nav-menu');
      await expect(userNavMenu).toBeVisible();

      const authMenuItem = adaContext.page.getByTestId('user-nav-item-auth');
      await expect(authMenuItem).toContainText('Sign out');
    });

    test('Do not authenticate as guest user when an existing non-guest session is active', async ({
      adaContext,
    }) => {
      const response = await adaContext.page.goto('/');

      if (!response) {
        throw new Error('Failed to load page');
      }

      let request = response.request();

      const chain = [];

      while (request) {
        chain.unshift(request.url());
        request = request.redirectedFrom();
      }

      expect(chain).toEqual(['http://localhost:3000/']);
    });
  });
