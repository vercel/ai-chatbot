import { handleAuth } from '@workos-inc/authkit-nextjs';
import {
  findOrCreateUserFromWorkOS,
  getDatabaseUserFromWorkOS,
} from '@/lib/db/queries';
import { storeGoogleCredentials } from '@/lib/google/client';

// Handle WorkOS AuthKit callback with user synchronization
export const GET = handleAuth({
  onSuccess: async ({
    user,
    accessToken,
    refreshToken,
    impersonator,
    oauthTokens,
  }) => {
    try {
      console.log('user', user);

      // Sync the WorkOS user with our database
      await findOrCreateUserFromWorkOS({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      });

      // Get the database user to get the database ID
      const databaseUser = await getDatabaseUserFromWorkOS({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      });

      // Store Google OAuth tokens if available
      console.log('=== OAUTH TOKENS DEBUG ===');
      console.log('oauthTokens exists:', !!oauthTokens);
      console.log('oauthTokens type:', typeof oauthTokens);
      console.log(
        'oauthTokens full object:',
        JSON.stringify(oauthTokens, null, 2),
      );
      console.log(
        'oauthTokens keys:',
        oauthTokens ? Object.keys(oauthTokens) : 'N/A',
      );
      console.log('databaseUser exists:', !!databaseUser);
      console.log('=== END OAUTH TOKENS DEBUG ===');

      if (oauthTokens && databaseUser) {
        // Try different property names as WorkOS might use different naming
        const accessToken =
          (oauthTokens as any).accessToken || (oauthTokens as any).access_token;
        const refreshToken =
          (oauthTokens as any).refreshToken ||
          (oauthTokens as any).refresh_token;
        const expiresAt =
          (oauthTokens as any).expiresAt || (oauthTokens as any).expires_at;

        console.log('=== EXTRACTED TOKENS ===');
        console.log('accessToken:', !!accessToken);
        console.log('refreshToken:', !!refreshToken);
        console.log('expiresAt:', expiresAt);
        console.log('Scopes:', (oauthTokens as any).scopes);
        console.log('=== END EXTRACTED TOKENS ===');

        // Check if we have Google Drive/Docs scopes
        const scopes = (oauthTokens as any).scopes || [];
        const hasDriveScope = scopes.some(
          (scope: string) => scope.includes('drive') || scope.includes('docs'),
        );

        if (!hasDriveScope) {
          console.warn(
            '⚠️  WARNING: No Google Drive/Docs scopes found. Current scopes:',
            scopes,
          );
          console.warn(
            '⚠️  Google Docs search will likely fail due to insufficient permissions',
          );
        }

        if (refreshToken && accessToken) {
          console.log('✅ Storing Google OAuth tokens for user:', user.email);

          // Fix timestamp conversion - expiresAt is already in milliseconds
          const expiryDate = expiresAt ? new Date(expiresAt) : undefined;
          console.log('Converted expiry date:', expiryDate);

          await storeGoogleCredentials(
            databaseUser.id,
            refreshToken,
            accessToken,
            expiryDate,
          );
        } else {
          console.log(
            '❌ Missing refresh token or access token - cannot store Google credentials',
          );
          console.log(
            'This might mean WorkOS scopes need to be configured properly',
          );
        }
      } else {
        console.log(
          'Missing oauthTokens or databaseUser - skipping Google credential storage',
        );
      }

      console.log(`Successfully synced user: ${user.email}`);
    } catch (error) {
      console.error('Failed to sync user with database:', error);
      // Don't throw here as it would break the auth flow
      // The user will still be authenticated via WorkOS
    }
  },
});
