import { expect, test } from '../fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe('/api/wallet', () => {
  test('GET /api/wallet/balance - should return initial wallet balance for authenticated user', async ({
    adaContext, // Uses the 'ada' authenticated context from fixtures
  }) => {
    const response = await adaContext.request.get('/api/wallet/balance');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('walletBalance');
    // New users created by createAuthenticatedContext should have a default walletBalance of 0
    // as defined in the schema.
    expect(body.walletBalance).toBe(0);
  });

  test('GET /api/wallet/balance - should return 401 for unauthenticated user', async ({
    page, // page fixture provides an unauthenticated context's request
  }) => {
    const response = await page.request.get('/api/wallet/balance');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toEqual('Unauthorized');
  });

  // More tests can be added here:
  // - After performing an action that credits the wallet, check if balance increases.
  //   This would require making a call that results in token consumption and crediting.
});
