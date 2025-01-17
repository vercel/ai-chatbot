import path from 'path';
import fs from 'fs';
import { test as baseTest, expect, Page } from '@playwright/test';

type Fixtures = {
  authenticatedPage: Page;
};

const testEmail = `chat@playwright.com`;
const testPassword = process.env.TEST_USER_PASSWORD ?? '';

const test = baseTest.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await expect(page.getByRole('heading')).toContainText('Sign In');
    await page.getByPlaceholder('user@acme.com').click();
    await page.getByPlaceholder('user@acme.com').fill(testEmail);
    await page.getByLabel('Password').click();
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByPlaceholder('Send a message...')).toBeVisible();
    await use(page);
  },
});

test.describe('chat', () => {
  test('submit a user message and receive response', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.getByPlaceholder('Send a message...').click();
    await authenticatedPage
      .getByPlaceholder('Send a message...')
      .fill('this is a test message, respond with "test"');
    await authenticatedPage.keyboard.press('Enter');
    await expect(authenticatedPage.getByRole('main')).toContainText('test');
  });

  test('redirect to /chat/:id after submitting message', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.getByPlaceholder('Send a message...').click();
    await authenticatedPage
      .getByPlaceholder('Send a message...')
      .fill('this is a test message, respond with "test"');
    await authenticatedPage.keyboard.press('Enter');
    await expect(authenticatedPage.getByRole('main')).toContainText('test');
    await expect(authenticatedPage).toHaveURL(
      /^http:\/\/localhost:3000\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  test('submit message through suggested actions', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage
      .getByRole('button', { name: 'What are the advantages of' })
      .click();
    await expect(
      authenticatedPage.getByText('What are the advantages of'),
    ).toBeVisible();
  });

  test('toggle between send/stop button based on activity', async ({
    authenticatedPage,
  }) => {
    await expect(authenticatedPage.getByTestId('send-button')).toBeDisabled();
    await authenticatedPage.getByPlaceholder('Send a message...').click();
    await authenticatedPage
      .getByPlaceholder('Send a message...')
      .fill('this is a test message, respond with "test"');
    await expect(
      authenticatedPage.getByTestId('send-button'),
    ).not.toBeDisabled();
    await authenticatedPage.keyboard.press('Enter');

    await expect(authenticatedPage.getByTestId('stop-button')).toBeVisible();
    await expect(authenticatedPage.getByRole('main')).toContainText('test');
    await expect(authenticatedPage.getByTestId('send-button')).toBeVisible();
  });

  test('stop generation after submission', async ({ authenticatedPage }) => {
    await authenticatedPage.getByPlaceholder('Send a message...').click();
    await authenticatedPage
      .getByPlaceholder('Send a message...')
      .fill('this is a test message, respond with "test"');
    await authenticatedPage.keyboard.press('Enter');
    await expect(authenticatedPage.getByRole('main')).toContainText('test');
    await authenticatedPage.getByTestId('stop-button').click();
    await expect(authenticatedPage.getByTestId('send-button')).toBeVisible();
  });

  test('edit user message and resubmit', async ({ authenticatedPage }) => {
    await authenticatedPage.getByTestId('multimodal-input').click();
    await authenticatedPage
      .getByTestId('multimodal-input')
      .fill('this is a test message, respond with "test"');
    await authenticatedPage.keyboard.press('Enter');

    await expect(authenticatedPage.getByTestId('message-user-0')).toContainText(
      'this is a test message, respond with "test"',
    );

    await expect(
      authenticatedPage.getByTestId('message-assistant-1'),
    ).toContainText('test');

    await authenticatedPage.getByTestId('edit-user-0').click();
    await authenticatedPage
      .getByTestId('message-editor')
      .fill('this is a test message, respond with "edited test"');

    await authenticatedPage.getByTestId('message-editor-send-button').click();

    await expect(authenticatedPage.getByTestId('message-user-0')).toContainText(
      'this is a test message, respond with "edited test"',
    );

    await expect(
      authenticatedPage.getByTestId('message-assistant-1'),
    ).toContainText('edited test');
  });

  test('hide suggested actions after sending message', async ({
    authenticatedPage,
  }) => {
    await expect(
      authenticatedPage.getByTestId('suggested-actions'),
    ).toBeVisible();

    await authenticatedPage
      .getByRole('button', { name: 'What are the advantages of' })
      .click();
    await expect(
      authenticatedPage.getByText('What are the advantages of'),
    ).toBeVisible();

    await authenticatedPage.getByPlaceholder('Send a message...').click();
    await authenticatedPage
      .getByPlaceholder('Send a message...')
      .fill('this is a test message, respond with "test"');
    await authenticatedPage.keyboard.press('Enter');

    await expect(
      authenticatedPage.getByTestId('suggested-actions'),
    ).not.toBeVisible();
  });

  test('show file selector on clicking attachments button', async ({
    authenticatedPage,
  }) => {
    const fileChooserPromise = authenticatedPage.waitForEvent('filechooser');
    await authenticatedPage.getByTestId('attachments-button').click();
    await fileChooserPromise;
  });

  test('handle file upload and send image attachment with message', async ({
    authenticatedPage,
  }) => {
    authenticatedPage.on('filechooser', async (fileChooser) => {
      const filePath = path.join(
        process.cwd(),
        'public',
        'images',
        'mouth of the seine, monet.jpg',
      );
      const imageBuffer = fs.readFileSync(filePath);

      await fileChooser.setFiles({
        name: 'mouth of the seine, monet.jpg',
        mimeType: 'image/jpeg',
        buffer: imageBuffer,
      });
    });

    await authenticatedPage.getByTestId('attachments-button').click();

    await expect(
      authenticatedPage.getByTestId('attachments-preview'),
    ).toBeVisible();

    await expect(
      authenticatedPage.getByTestId('input-attachment-loader'),
    ).toBeVisible();

    await authenticatedPage.getByTestId('multimodal-input').click();
    await authenticatedPage
      .getByTestId('multimodal-input')
      .fill('this is a test message, respond with "test"');

    await expect(authenticatedPage.getByTestId('send-button')).toBeVisible();
    await authenticatedPage.getByTestId('send-button').click();

    await expect(
      authenticatedPage.getByTestId('message-attachments-0'),
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId('message-assistant-1'),
    ).toBeVisible();
  });
});
