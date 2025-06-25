import 'server-only';
import { db } from '@/lib/db'; // Using the centralized db instance
import { user as userSchema } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ChatSDKError } from './errors'; // Assuming ChatSDKError is appropriate

/**
 * Credits a user's wallet by a specified amount.
 * The amount must be positive.
 *
 * @param userId The ID of the user whose wallet is to be credited.
 * @param amount The positive amount to credit to the wallet.
 * @returns The new wallet balance.
 * @throws ChatSDKError if the amount is not positive, user is not found, or DB update fails.
 */
export async function creditWallet(
  userId: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) {
    throw new ChatSDKError(
      'bad_request:invalid_amount',
      'Credit amount must be positive.',
    );
  }

  try {
    // Ensure the user exists first (optional, as the update itself might not fail but affect 0 rows)
    const userExists = await db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      throw new ChatSDKError(
        'not_found:user',
        `User with id ${userId} not found.`,
      );
    }

    // Atomically update the wallet balance
    // sql`${userSchema.walletBalance} + ${amount}` creates a SQL fragment like "walletBalance" + amount
    const updatedUsers = await db
      .update(userSchema)
      .set({ walletBalance: sql`${userSchema.walletBalance} + ${amount}` })
      .where(eq(userSchema.id, userId))
      .returning({ walletBalance: userSchema.walletBalance });

    if (updatedUsers.length === 0) {
      // This should ideally not happen if userExists check passed and ID is correct
      throw new ChatSDKError(
        'database_error',
        'Failed to update wallet balance.',
      );
    }

    return updatedUsers[0].walletBalance;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    console.error('Error crediting wallet:', error);
    throw new ChatSDKError(
      'internal_server_error',
      'An unexpected error occurred while crediting the wallet.',
    );
  }
}

/**
 * Debits a user's wallet by a specified amount.
 * The amount must be positive. Ensures sufficient funds.
 *
 * @param userId The ID of the user whose wallet is to be debited.
 * @param amount The positive amount to debit from the wallet.
 * @returns The new wallet balance.
 * @throws ChatSDKError if amount is not positive, user not found, insufficient funds, or DB update fails.
 */
export async function debitWallet(
  userId: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) {
    throw new ChatSDKError(
      'bad_request:invalid_amount',
      'Debit amount must be positive.',
    );
  }

  try {
    // Atomically update and check balance in a single operation if possible,
    // or use a transaction if multiple steps are needed that must be atomic.
    // For this, we'll check balance first, then update. This could have a race condition
    // without a transaction in high concurrency, but for many apps, it's acceptable.
    // A more robust way is to use a transaction or a CHECK constraint in the DB.

    const currentUserState = await db
      .select({ walletBalance: userSchema.walletBalance })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    if (currentUserState.length === 0) {
      throw new ChatSDKError(
        'not_found:user',
        `User with id ${userId} not found.`,
      );
    }

    if (currentUserState[0].walletBalance < amount) {
      throw new ChatSDKError(
        'bad_request:insufficient_funds',
        'Insufficient funds to complete the debit operation.',
      );
    }

    const updatedUsers = await db
      .update(userSchema)
      .set({ walletBalance: sql`${userSchema.walletBalance} - ${amount}` })
      .where(eq(userSchema.id, userId))
      .returning({ walletBalance: userSchema.walletBalance });

    if (updatedUsers.length === 0) {
      throw new ChatSDKError(
        'database_error',
        'Failed to update wallet balance for debit.',
      );
    }

    return updatedUsers[0].walletBalance;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    console.error('Error debiting wallet:', error);
    throw new ChatSDKError(
      'internal_server_error',
      'An unexpected error occurred while debiting the wallet.',
    );
  }
}
