// fix-user-profile.js
// This script checks if a user profile exists for a given Clerk ID
// and creates one if needed.

import { db } from './lib/db/queries.js';
import { userProfiles } from './lib/db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

// Replace this with your actual Clerk ID (check LocalStorage in browser)
const CLERK_ID = 'user_REPLACE_WITH_YOUR_CLERK_ID';

async function main() {
  console.log(`Checking for user profile with Clerk ID: ${CLERK_ID}`);

  try {
    // Check if profile exists
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.clerkId, CLERK_ID),
    });

    if (existingProfile) {
      console.log(`Profile EXISTS with ID: ${existingProfile.id}`);
      return;
    }

    // Create new profile if not found
    const newProfileId = crypto.randomUUID();

    await db.insert(userProfiles).values({
      id: newProfileId,
      clerkId: CLERK_ID,
    });

    console.log(`Created new profile with ID: ${newProfileId}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
