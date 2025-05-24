
// Use "import type" for type-only imports
import type { WebhookEvent, UserJSON } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server'; // Keep NextResponse as value import
import type { NextRequest } from 'next/server'; // Import NextRequest specifically as type
import { db } from '@/lib/db/queries'; // Corrected import path for db
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto'; // <-- Keep as value import
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

// ADDED: Get the shared webhook secret key
const N8N_WEBHOOK_SECRET_KEY = process.env.N8N_WEBHOOK_SECRET_KEY;

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
    const { id: clerkId } = userData; // Only need clerkId here
    const email = getPrimaryEmail(userData); // Use the helper function

    if (!clerkId) {
      console.error(
        'Clerk Webhook Error: Missing id in user.created event data',
      );
      return new Response('Invalid payload data: Missing user ID', {
        status: 400,
      });
    }

    console.log(
      `Processing user.created for Clerk ID: ${clerkId}, Email: ${email}`,
    );

    // --- START REVISED UPSERT LOGIC (Using Actual Schema) ---
    try {
      const newProfileId = crypto.randomUUID();

      console.log(
        `[Webhook Handler] Attempting upsert for clerkId: ${clerkId}, email: ${email}`,
      );

      // Perform the Upsert Operation using ONLY existing columns
      await db
        .insert(userProfiles)
        .values({
          id: newProfileId, // Provide UUID for potential insert
          clerkId: clerkId,
          email: email, // Email from Clerk
          // Database defaults will handle created_at, modified_at
        })
        .onConflictDoUpdate({
          target: userProfiles.clerkId, // The column with the unique constraint
          set: {
            // Fields to update if conflict occurs on clerkId
            email: email, // Update email if it changed
            // modified_at could potentially be updated here if desired:
            // modified_at: new Date(),
          },
        });

      console.log(
        `Clerk Webhook: Successfully upserted user profile for Clerk ID: ${clerkId}`,
      );

      // --- IMMEDIATELY Update Clerk Metadata with Internal DB ID ---
      // Fetch profile right after upsert to get the definitive internal ID
      const profileAfterUpsert = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.clerkId, clerkId),
      });

      let profileIdToUse: string | null = null;
      if (profileAfterUpsert) {
        profileIdToUse = profileAfterUpsert.id;
        try {
          console.log(
            `Clerk Webhook: Updating Clerk metadata immediately with internal_db_id: ${profileIdToUse} for Clerk ID: ${clerkId}`,
          );
          const client = await clerkClient(); // Await the client
          await client.users.updateUserMetadata(clerkId, {
            // Use awaited client
            publicMetadata: {
              internal_db_id: profileIdToUse,
            },
          });
          console.log(
            `Clerk Webhook: Successfully set internal_db_id in Clerk metadata for ${clerkId}.`,
          );
        } catch (metaError) {
          // Log critical failure, but don't necessarily stop the N8N call yet
          console.error(
            `Clerk Webhook: CRITICAL: Failed to set internal_db_id in Clerk metadata for ${clerkId}:`,
            metaError,
          );
        }
      } else {
        // This case should ideally not happen after a successful upsert
        console.error(
          `Clerk Webhook Error: Profile not found for clerkId ${clerkId} immediately after upsert. Cannot set internal_db_id metadata.`,
        );
        // Decide if you want to proceed without the ID or return an error
        // For now, we'll log and proceed, N8N call might fail or miss data.
      }
      // --- End Immediate Metadata Update ---

      // --- N8N Call Section (Now profileIdToUse might be null if fetch failed) ---
      // Use public_metadata from Clerk payload (check if already sent)
      const alreadySent =
        userData.public_metadata?.onboarding_webhook_sent ?? false;

      if (alreadySent) {
        console.log(
          `Clerk Webhook: Onboarding webhook already marked as sent for Clerk ID: ${clerkId}. Skipping N8N call.`,
        );
      } else if (!profileIdToUse) {
        // If we couldn't get the profile ID earlier, we can't reliably call N8N with it.
        console.log(
          `Clerk Webhook: Skipping N8N call for Clerk ID: ${clerkId} because internal profile ID could not be determined after upsert.`,
        );
      } else {
        // Proceed with N8N call only if we have the internal ID
        console.log(
          `Clerk Webhook: Triggering N8N onboarding for Clerk ID: ${clerkId}, Profile ID: ${profileIdToUse}.`,
        );

        // ADDED: Prepare headers for N8N call
        const n8nHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (N8N_WEBHOOK_SECRET_KEY) {
          n8nHeaders.Authorization = `Bearer ${N8N_WEBHOOK_SECRET_KEY}`;
        } else {
          // Log a warning if the key is missing, as the N8N call might fail if auth is required
          console.warn(
            '[Clerk Webhook] N8N_WEBHOOK_SECRET_KEY is not set. Sending unauthenticated request to onboarding webhook.',
          );
        }

        const payload = {
          clerk_user_id: userData.id,
          primary_email: email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image_url: userData.image_url,
          created_at: new Date(userData.created_at).toISOString(),
          updated_at: new Date(userData.updated_at).toISOString(),
          internal_db_user_id: profileIdToUse, // Use the fetched ID
        };

        // Call N8N Webhook
        try {
          const response = await fetch(N8N_ONBOARDING_WEBHOOK_URL, {
            method: 'POST',
            headers: n8nHeaders, // USE new headers object
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const responseBody = await response.text();
            console.error(
              `Clerk Webhook: N8N call failed for ${clerkId}. Status: ${response.status}, Body: ${responseBody}`,
            );
          } else {
            console.log(
              `Clerk Webhook: N8N call successful for ${clerkId}. Status: ${response.status}. Updating Clerk metadata.`,
            );
            // Update ONLY the webhook sent flag in Clerk Metadata
            try {
              const client = await clerkClient(); // Await the client
              await client.users.updateUserMetadata(clerkId, {
                // Use awaited client
                publicMetadata: {
                  onboarding_webhook_sent: true, // ONLY set this flag now
                },
              });
              console.log(
                `Clerk Webhook: Successfully updated onboarding_webhook_sent flag in Clerk metadata for ${clerkId}.`,
              );
            } catch (metaError) {
              // Log critical failure to update the *sent* flag
              console.error(
                `Clerk Webhook: CRITICAL: Failed to update onboarding_webhook_sent flag in Clerk metadata for ${clerkId} after successful N8N call:`,
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
      // --- End N8N Call Section ---

      return NextResponse.json(
        { message: 'User profile processed' }, // Updated message
        { status: 200 },
      );
    } catch (dbError) {
      console.error(
        `Clerk Webhook Error: Database upsert failed for user.created (Clerk ID ${clerkId}):`,
        dbError,
      );
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
