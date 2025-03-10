import path from 'path';
import { expect, test as setup } from '@playwright/test';
import { ChatPage } from './pages/chat';

const reasoningFile = path.join(
  __dirname,
  '../playwright/.artifact/session.json',
);

setup('start text artifact session', async ({ page }) => {
  const chatPage = new ChatPage(page);
  await chatPage.createNewChat();

  await chatPage.sendUserMessage('help me write a haiku about noe valley');
  await chatPage.isElementVisible('artifact');
});
