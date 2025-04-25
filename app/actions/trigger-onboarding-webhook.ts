'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getGoogleOAuthToken } from '@/app/actions/get-google-token';

// Define the N8N Webhook URL (replace if different from the one discussed)
const N8N_ONBOARDING_WEBHOOK_URL =
  'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e';

export async function triggerOnboardingWebhook(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  console.log('[Action triggerOnboardingWebhook] Starting...');

  try {
    // Add log *before* calling auth()
    console.log(
      '[Action triggerOnboardingWebhook] Attempting to call auth()...',
    );
    const { userId: clerkUserId } = auth();
    console.log(
      `[Action triggerOnboardingWebhook] auth() call completed. Clerk User ID: ${clerkUserId}`,
    ); // Log immediately after

    if (!clerkUserId) {
      console.log(
        '[Action triggerOnboardingWebhook] User not authenticated (clerkUserId is null/undefined).',
      );
      return { success: false, message: 'User not authenticated' };
    }

    console.log(
      `[Action triggerOnboardingWebhook] Authenticated Clerk User ID: ${clerkUserId}`,
    );

    // Fetch the full user object from Clerk
    const user = await clerkClient.users.getUser(clerkUserId);

    // Check if onboarding webhook has already been sent
    if (user.publicMetadata?.onboarding_webhook_sent === true) {
      console.log(
        `[Action triggerOnboardingWebhook] Onboarding webhook already sent for user ${clerkUserId}. Skipping.`,
      );
      return { success: true, message: 'Onboarding webhook already sent.' };
    }

    console.log(
      `[Action triggerOnboardingWebhook] Onboarding flag not set for user ${clerkUserId}. Proceeding...`,
    );

    // Fetch the Google OAuth token
    const tokenResult = await getGoogleOAuthToken();

    if (tokenResult.error || !tokenResult.token) {
      console.error(
        `[Action triggerOnboardingWebhook] Failed to get Google OAuth token for user ${clerkUserId}: ${tokenResult.error || 'Token missing'}`,
        tokenResult,
      );
      // Don't mark as sent, allow retry on next login
      return {
        success: false,
        message: `Failed to get Google OAuth token: ${tokenResult.error || 'Token missing'}`,
        details: tokenResult,
      };
    }

    console.log(
      `[Action triggerOnboardingWebhook] Successfully fetched Google OAuth token for user ${clerkUserId}.`,
    );

    // --- Construct the payload ---
    // Attempt to mimic the old Supabase payload structure using Clerk data
    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    )?.emailAddress;
    const primaryPhone = user.phoneNumbers.find(
      (p) => p.id === user.primaryPhoneNumberId,
    )?.phoneNumber;

    // Note: raw_user_meta_data and raw_app_meta_data structure was specific to Supabase Auth
    // We include relevant Clerk fields instead.
    const payload = {
      clerk_user_id: user.id,
      primary_email: primaryEmail,
      primary_phone: primaryPhone, // Might be null
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.imageUrl,
      created_at: new Date(user.createdAt).toISOString(),
      updated_at: new Date(user.updatedAt).toISOString(),
      clerk_metadata: {
        // Include Clerk metadata if useful
        public: user.publicMetadata,
        private: user.privateMetadata, // Be cautious about exposing private metadata
        unsafe: user.unsafeMetadata,
      },
      // Match the old structure for tokens
      provider_tokens: {
        access_token: tokenResult.token,
        refresh_token: null, // Clerk typically manages refresh tokens internally
      },
    };

    console.log(
      `[Action triggerOnboardingWebhook] Sending payload to N8N for user ${clerkUserId}:`,
      JSON.stringify(payload, null, 2),
    );

    // --- Call the N8N Webhook ---
    const response = await fetch(N8N_ONBOARDING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(
        `[Action triggerOnboardingWebhook] N8N webhook call failed for user ${clerkUserId}. Status: ${response.status}, Body: ${responseBody}`,
      );
      // Don't mark as sent, allow retry
      return {
        success: false,
        message: `N8N webhook call failed with status ${response.status}`,
        details: responseBody,
      };
    }

    console.log(
      `[Action triggerOnboardingWebhook] N8N webhook call successful for user ${clerkUserId}. Status: ${response.status}`,
    );

    // --- Update Clerk Metadata on Success ---
    try {
      await clerkClient.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          onboarding_webhook_sent: true,
        },
      });
      console.log(
        `[Action triggerOnboardingWebhook] Successfully updated Clerk public metadata for user ${clerkUserId} to mark onboarding as sent.`,
      );
    } catch (metaError) {
      console.error(
        `[Action triggerOnboardingWebhook] CRITICAL: Failed to update Clerk metadata for user ${clerkUserId} after successful N8N call:`,
        metaError,
      );
      // Log critical error, but still return success as N8N call worked.
      // Manual intervention might be needed if this happens often.
      return {
        success: true,
        message: 'N8N webhook sent, but failed to update Clerk metadata.',
        details: metaError,
      };
    }

    return {
      success: true,
      message: 'Onboarding webhook sent successfully and metadata updated.',
    };
  } catch (error) {
    console.error('[Action triggerOnboardingWebhook] Unexpected error:', error);
    // Don't mark as sent
    const message =
      error instanceof Error ? error.message : 'Unknown server error';
    return {
      success: false,
      message: `Server action failed: ${message}`,
      details: error,
    };
  }
}
