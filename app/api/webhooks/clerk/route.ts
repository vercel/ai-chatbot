import { Webhook } from 'svix';
import { headers } from 'next/headers';
// Use "import type" for type-only imports
import type { WebhookEvent, UserJSON } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/queries'; // Corrected import path for db
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto'; // Use node: prefix for built-in module
import { getGoogleOAuthToken } from '@/app/actions/get-google-token';
import { clerkClient } from '@clerk/nextjs/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks'; // <-- Add this import

// Function to safely extract primary email
function getPrimaryEmail(user: UserJSON): string | undefined {
  return user.email_addresses.find(
    (e) => e.id === user.primary_email_address_id,
  )?.email_address;
}

// ADD: N8N Webhook URL (consider moving to env var)
const N8N_ONBOARDING_WEBHOOK_URL =
  'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e';

export async function POST(req: NextRequest) {
  // --- ADD DEBUG LOG ---
  console.log('[Webhook Handler] POST function invoked.');
  // --- END DEBUG LOG ---
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error(
      'Clerk Webhook Error: CLERK_WEBHOOK_SECRET environment variable not set.',
    );
    return new Response('Server configuration error', { status: 500 });
  }

  // --- Verification using @clerk/nextjs/webhooks ---
  let evt: WebhookEvent;
  try {
    // verifyWebhook handles header reading, body parsing, and signature verification
    evt = await verifyWebhook(req);
  } catch (err: any) {
    // Log the specific verification error
    console.error('Clerk Webhook Error: Verification failed:', err);
    // Respond with a generic 400, or include err.message if appropriate
    return new Response('Webhook verification failed', { status: 400 });
  }
  // --- End Verification ---

  const eventType = evt.type;
  console.log(`Clerk Webhook Received: Type=${eventType}`);

  // -------- Handle User Created --------
  if (eventType === 'user.created') {
    // Type guard to ensure we have UserJSON data
    if (evt.data.object !== 'user') {
      console.error(
        'Clerk Webhook Error: Expected user object for user.created event',
      );
      return new Response('Invalid payload data for user.created', {
        status: 400,
      });
    }
    const userData = evt.data as UserJSON;
    const { id: clerkId, email_addresses, primary_email_address_id } = userData;

    if (!clerkId) {
      console.error(
        'Clerk Webhook Error: Missing id in user.created event data',
      );
      return new Response('Invalid payload data: Missing user ID', {
        status: 400,
      });
    }

    const email = email_addresses.find(
      (e) => e.id === primary_email_address_id,
    )?.email_address;
    console.log(
      `Processing user.created for Clerk ID: ${clerkId}, Email: ${email}`,
    );

    try {
      const existingProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.clerkId, clerkId),
      });

      // If profile doesn't exist, create it
      if (!existingProfile) {
        // Generate a new UUID for the primary key
        const newProfileId = crypto.randomUUID();

        // Insert new user profile
        await db.insert(userProfiles).values({
          id: newProfileId, // Provide the generated UUID
          clerkId: clerkId,
          // email: email, // Uncomment if needed
        });
        console.log(
          `Clerk Webhook: Successfully created user profile for Clerk ID: ${clerkId} with Profile ID: ${newProfileId}`,
        );
      } else {
        console.log(
          `Clerk Webhook: User profile already exists for Clerk ID: ${clerkId}.`,
        );
      }

      // --- N8N Onboarding Webhook Logic ---
      console.log(
        `Clerk Webhook: Checking N8N onboarding status for ${clerkId}`,
      );

      // Check metadata *before* potentially calling N8N
      // Need to use clerkClient here, not the user object from the event directly
      // Note: This assumes you use the same `await clerkClient()` pattern needed elsewhere
      const client = await clerkClient(); // Assuming await is needed based on other files
      const clerkUser = await client.users.getUser(clerkId);

      if (clerkUser.publicMetadata?.onboarding_webhook_sent === true) {
        console.log(
          `Clerk Webhook: N8N onboarding already marked as sent for ${clerkId}. Skipping N8N call.`,
        );
      } else {
        console.log(
          `Clerk Webhook: N8N onboarding flag not set for ${clerkId}. Fetching token and calling N8N...`,
        );
        // Fetch Google Token using the action
        const tokenResult = await getGoogleOAuthToken(); // Uses auth() internally, should be correct context here

        if (tokenResult.error || !tokenResult.token) {
          console.error(
            `Clerk Webhook: Failed to get Google OAuth token for user ${clerkId}: ${tokenResult.error || 'Token missing'}`,
            tokenResult,
          );
          // Decide if this is critical - maybe still return 200 to Clerk?
          // Or return 500 to signal Clerk to retry? For now, log error and continue.
        } else {
          console.log(
            `Clerk Webhook: Successfully fetched Google token for ${clerkId}. Sending to N8N.`,
          );
          // Construct payload (using data from event 'userData', not refetched 'clerkUser')
          const payload = {
            clerk_user_id: userData.id,
            primary_email: email, // Already extracted above
            // Add other relevant fields from userData if needed...
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image_url: userData.image_url,
            created_at: new Date(userData.created_at).toISOString(),
            updated_at: new Date(userData.updated_at).toISOString(),
            provider_tokens: {
              access_token: tokenResult.token,
              refresh_token: null, // As before
            },
          };

          // Call N8N Webhook
          const n8nResponse = await fetch(N8N_ONBOARDING_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!n8nResponse.ok) {
            const n8nResponseBody = await n8nResponse.text();
            console.error(
              `Clerk Webhook: N8N call failed for ${clerkId}. Status: ${n8nResponse.status}, Body: ${n8nResponseBody}`,
            );
            // Decide on error handling - maybe don't update metadata?
          } else {
            console.log(
              `Clerk Webhook: N8N call successful for ${clerkId}. Status: ${n8nResponse.status}. Updating Clerk metadata.`,
            );
            // --- Update Clerk Metadata on Success ---
            try {
              await client.users.updateUserMetadata(clerkId, {
                // Use the same awaited client
                publicMetadata: { onboarding_webhook_sent: true },
              });
              console.log(
                `Clerk Webhook: Successfully updated Clerk metadata for ${clerkId}.`,
              );
            } catch (metaError) {
              console.error(
                `Clerk Webhook: CRITICAL: Failed to update Clerk metadata for ${clerkId} after successful N8N call:`,
                metaError,
              );
              // Log critical error, but webhook was processed.
            }
          }
        }
      }

      return NextResponse.json(
        { message: 'User profile processed' },
        { status: 200 }, // Return 200 even if profile existed, as we checked N8N
      );
    } catch (dbError) {
      console.error(
        `Clerk Webhook Error: Database insert failed for user.created (Clerk ID ${clerkId}):`,
        dbError,
      );
      return new Response('Database operation failed', { status: 500 });
    }
  }

  // -------- Handle User Deleted --------
  else if (eventType === 'user.deleted') {
    // Deleted event might just have { id, deleted: true }
    const clerkId = evt.data.id;

    if (!clerkId) {
      console.error(
        'Clerk Webhook Error: Missing id in user.deleted event data',
      );
      return new Response('Invalid payload data for delete: Missing user ID', {
        status: 400,
      });
    }

    console.log(`Processing user.deleted for Clerk ID: ${clerkId}`);
    try {
      const deleteResult = await db
        .delete(userProfiles)
        .where(eq(userProfiles.clerkId, clerkId))
        .returning({ id: userProfiles.id });
      if (deleteResult.length > 0) {
        console.log(
          `Clerk Webhook: Successfully deleted user profile for Clerk ID: ${clerkId}`,
        );
        return NextResponse.json(
          { message: 'User profile deleted' },
          { status: 200 },
        );
      } else {
        console.log(
          `Clerk Webhook: No user profile found to delete for Clerk ID: ${clerkId}`,
        );
        return NextResponse.json(
          { message: 'User profile not found' },
          { status: 404 },
        );
      }
    } catch (dbError) {
      console.error(
        `Clerk Webhook Error: Database delete failed for user.deleted (Clerk ID ${clerkId}):`,
        dbError,
      );
      return new Response('Database deletion failed', { status: 500 });
    }
  }

  // -------- Handle User Updated --------
  else if (eventType === 'user.updated') {
    if (evt.data.object !== 'user') {
      console.warn(
        'Clerk Webhook: Received user.updated event with non-user object type.',
      );
      return new Response('Webhook received (skipped non-user update)', {
        status: 200,
      });
    }
    const userData = evt.data as UserJSON;
    const { id: clerkId, email_addresses, primary_email_address_id } = userData;
    const email = email_addresses?.find(
      (e) => e.id === primary_email_address_id,
    )?.email_address;
    console.log(
      `Processing user.updated for Clerk ID: ${clerkId}. Email: ${email}. Add logic if needed.`,
    );
    // Add update logic here if desired, e.g.:
    // await db.update(userProfiles).set({ email: email, modifiedAt: new Date() }).where(eq(userProfiles.clerkId, clerkId));
  }

  console.log(
    `Clerk Webhook: Received unhandled/processed event type: ${eventType}`,
  );
  return new Response('Webhook received', { status: 200 });
}
