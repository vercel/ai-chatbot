// import { Webhook } from 'svix'; // No longer needed
import { headers } from 'next/headers';
// Use "import type" for type-only imports
import type { WebhookEvent, UserJSON } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/queries'; // Corrected import path for db
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto'; // <-- Keep as value import
import { getGoogleOAuthToken } from '@/app/actions/get-google-token';
import { clerkClient } from '@clerk/nextjs/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';

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

    // --- START REVISED UPSERT LOGIC ---
    try {
      const newProfileId = crypto.randomUUID(); // Still needed for the initial insert attempt
      // const email = getPrimaryEmail(userData); // Email already extracted above

      console.log(
        `[Webhook Handler] Attempting upsert for clerkId: ${clerkId}, email: ${email}`,
      );

      // Perform the Upsert Operation
      await db
        .insert(userProfiles)
        .values({
          id: newProfileId, // Provide UUID for potential insert
          clerkId: clerkId,
          email: email,
          // Add other relevant fields from userData
          firstName: userData.first_name, // Ensure these fields exist in your schema or remove
          lastName: userData.last_name,
          imageUrl: userData.image_url,
          createdAt: new Date(userData.created_at), // Set createdAt on initial insert
          updatedAt: new Date(userData.updated_at), // Set updatedAt on initial insert
        })
        .onConflictDoUpdate({
          target: userProfiles.clerkId, // The column with the unique constraint
          set: {
            // Fields to update if conflict occurs on clerkId
            email: email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            imageUrl: userData.image_url,
            updatedAt: new Date(), // Update updatedAt timestamp on conflict
            // DO NOT update 'id' (primary key) or 'clerkId' (conflict target)
            // DO NOT update 'createdAt'
          },
          // Example of optional where clause for the update part:
          // where: sql`${userProfiles.email} is distinct from ${email}`
        });

      console.log(
        `Clerk Webhook: Successfully upserted user profile for Clerk ID: ${clerkId}`,
      );

      // --- N8N Call Section (Fetch profile *after* upsert) ---
      // Refetch the profile to get the definitive internal ID (new or existing)
      const profileAfterUpsert = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.clerkId, clerkId),
      });

      if (!profileAfterUpsert) {
        console.error(
          `Clerk Webhook Error: Profile not found for clerkId ${clerkId} immediately after upsert. Cannot proceed with N8N call.`,
        );
        // Decide if this should be a hard error or just skip N8N
        // return new Response('Failed to retrieve profile post-upsert', { status: 500 });
      } else {
        const profileIdToUse = profileAfterUpsert.id;
        const alreadySent =
          userData.publicMetadata?.onboarding_webhook_sent ?? false;

        if (alreadySent) {
          console.log(
            `Clerk Webhook: Onboarding webhook already marked as sent for Clerk ID: ${clerkId}. Skipping N8N call.`,
          );
        } else {
          console.log(
            `Clerk Webhook: Triggering N8N onboarding for Clerk ID: ${clerkId}, Profile ID: ${profileIdToUse}.`,
          );

          const payload = {
            clerk_user_id: userData.id,
            primary_email: email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image_url: userData.image_url,
            created_at: new Date(userData.created_at).toISOString(),
            updated_at: new Date(userData.updated_at).toISOString(),
            your_internal_db_id: profileIdToUse, // Use the ID from the upserted record
          };

          // Call N8N Webhook
          try {
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
            } else {
              console.log(
                `Clerk Webhook: N8N call successful for ${clerkId}. Status: ${n8nResponse.status}. Updating Clerk metadata.`,
              );
              // Update Clerk Metadata on Success
              try {
                // Consider initializing clerkClient outside the handler if possible
                const client = await clerkClient();
                await client.users.updateUserMetadata(clerkId, {
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
              }
            }
          } catch (fetchError) {
            console.error(
              `Clerk Webhook: Error calling N8N fetch for ${clerkId}:`,
              fetchError,
            );
          }
        }
      }
      // --- End N8N Call Section ---

      return NextResponse.json(
        { message: 'User profile processed via upsert' },
        { status: 200 },
      );
    } catch (dbError) {
      console.error(
        `Clerk Webhook Error: Database upsert failed for user.created (Clerk ID ${clerkId}):`,
        dbError,
      );
      // Consider checking error type for constraint violation vs other errors
      return new Response('Database operation failed', { status: 500 });
    }
    // --- END REVISED UPSERT LOGIC ---
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
