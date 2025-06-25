import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user as userSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { creditWallet, debitWallet } from '@/lib/wallet';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';

// Schema for request validation
const adjustWalletSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int(), // Can be positive (credit) or negative (debit)
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin status
  const adminUser = await db
    .select({ isAdmin: userSchema.isAdmin })
    .from(userSchema)
    .where(eq(userSchema.id, session.user.id))
    .limit(1);

  if (adminUser.length === 0 || !adminUser[0].isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate request body
  let validatedData: z.infer<typeof adjustWalletSchema>;
  try {
    const jsonData = await request.json();
    validatedData = adjustWalletSchema.parse(jsonData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

  const { userId, amount } = validatedData;

  if (amount === 0) {
    return NextResponse.json({ error: 'Amount cannot be zero' }, { status: 400 });
  }

  try {
    let newBalance;
    if (amount > 0) {
      newBalance = await creditWallet(userId, amount);
    } else {
      // amount is negative, so Math.abs(amount) for debitWallet which expects positive
      newBalance = await debitWallet(userId, Math.abs(amount));
    }
    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      // Map ChatSDKError (e.g., insufficient_funds, not_found:user) to appropriate responses
      const status = error.type.startsWith('not_found') ? 404 : 400;
      return NextResponse.json({ error: error.message, type: error.type }, { status });
    }
    console.error('Error adjusting wallet balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
