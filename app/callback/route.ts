import { handleAuth } from '@workos-inc/authkit-nextjs';
import { findOrCreateUserFromWorkOS } from '@/lib/db/queries';

// Handle WorkOS AuthKit callback with user synchronization
export const GET = handleAuth({
  onSuccess: async ({ user, accessToken, refreshToken, impersonator }) => {
    try {
      console.log('user', user);


      // Sync the WorkOS user with our database
      await findOrCreateUserFromWorkOS({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      });

      console.log(`Successfully synced user: ${user.email}`);
    } catch (error) {
      console.error('Failed to sync user with database:', error);
      // Don't throw here as it would break the auth flow
      // The user will still be authenticated via WorkOS
    }
  },
});
