import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent, UserJSON } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries'; // Corrected import path for db
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto'; // Use node: prefix for built-in module

// Function to safely extract primary email
function getPrimaryEmail(user: UserJSON): string | undefined {
  return user.email_addresses.find(
    (e) => e.id === user.primary_email_address_id,
  )?.email_address;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error(
      'Clerk Webhook Error: CLERK_WEBHOOK_SECRET environment variable not set.',
    );
    return new Response('Server configuration error', { status: 500 });
  }

  // Get the headers using the recommended way for Route Handlers
  const headerPayload = req.headers;
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Clerk Webhook Error: Missing svix headers');
    return new Response('Missing svix headers', { status: 400 });
  }

  const payloadBody = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(payloadBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err: any) {
    console.error('Clerk Webhook Error: Verification failed:', err.message);
    return new Response(`Webhook verification failed: ${err.message}`, {
      status: 400,
    });
  }

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

      if (existingProfile) {
        console.log(
          `Clerk Webhook: User profile already exists for Clerk ID: ${clerkId}. Skipping creation.`,
        );
        return NextResponse.json(
          { message: 'User profile already exists' },
          { status: 200 },
        );
      }

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
      return NextResponse.json(
        { message: 'User profile created' },
        { status: 201 },
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
