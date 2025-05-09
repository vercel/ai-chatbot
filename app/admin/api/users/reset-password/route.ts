import 'server-only';
import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';
import { hash } from 'bcrypt';

// Setup database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Helper function to generate a random password
function generateTemporaryPassword(): string {
  // Country-Word##### format (e.g., Holland-Football83748)
  const countries = [
    'Australia',
    'Brazil',
    'Canada',
    'Denmark',
    'Egypt',
    'France',
    'Germany',
    'Holland',
    'India',
    'Japan',
    'Kenya',
    'Mexico',
    'Norway',
    'Portugal',
    'Russia',
    'Spain',
    'Thailand',
    'Ukraine',
    'Vietnam',
    'Wales',
  ];

  const words = [
    'Apple',
    'Basketball',
    'Computer',
    'Diamond',
    'Elephant',
    'Football',
    'Guitar',
    'Hospital',
    'Internet',
    'Jungle',
    'Kitchen',
    'Library',
    'Mountain',
    'Notebook',
    'Orange',
    'Pencil',
    'Question',
    'Rainbow',
    'Summer',
    'Telephone',
  ];

  const country = countries[Math.floor(Math.random() * countries.length)];
  const word = words[Math.floor(Math.random() * words.length)];
  const numbers = Math.floor(10000 + Math.random() * 90000); // 5-digit number

  return `${country}-${word}${numbers}`;
}

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// POST /admin/api/users/reset-password - Reset a user's password
export async function POST(request: Request) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    const { userId } = await request.json();

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // Generate a new temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hash(temporaryPassword, 10);

    // Update the user's password
    const updatedUser = await db
      .update(user)
      .set({ password: hashedPassword })
      .where(eq(user.id, userId))
      .returning({ id: user.id, email: user.email });

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the temporary password and user info
    return NextResponse.json({
      success: true,
      userId: updatedUser[0].id,
      email: updatedUser[0].email,
      temporaryPassword,
    });
  } catch (error) {
    console.error('Failed to reset password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    );
  }
}
