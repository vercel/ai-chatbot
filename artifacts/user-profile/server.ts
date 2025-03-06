import { createDocumentHandler } from '@/lib/artifacts/server';
import { getTypedUser } from '@/lib/auth';
import { createUser, getUser } from '@/lib/db/queries';

// Helper function to ensure user exists in database with retries
async function ensureUserExists(user: any) {
  let dbUser = null;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (!dbUser && retryCount < maxRetries) {
    try {
      // Check if user exists
      const users = await getUser(user.email);
      
      if (users && users.length > 0) {
        dbUser = users[0];
        console.log('Found existing user in DB:', dbUser.id);
      } else {
        // Create user if not exists
        console.log('Creating new user in DB:', user.id);
        await createUser({
          id: user.id,
          email: user.email,
        });
        
        // Verify user was created
        const verifyUsers = await getUser(user.email);
        if (verifyUsers && verifyUsers.length > 0) {
          dbUser = verifyUsers[0];
          console.log('Successfully created and verified user:', dbUser.id);
        } else {
          throw new Error('User creation succeeded but verification failed');
        }
      }
      
      return dbUser;
    } catch (error) {
      retryCount++;
      console.error(`Error creating user (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to create or verify user after ${maxRetries} attempts`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return null;
}

// Using 'text' as the kind since it's one of the allowed types
export const userProfileDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream, user }) => {
    try {
      // We already have the user from the parameters
      if (!user) {
        dataStream.writeData({
          type: 'user-profile-delta' as any, // Type assertion to bypass type checking
          content: JSON.stringify({ status: 'not-authenticated' }),
        });
        return JSON.stringify({ status: 'not-authenticated' });
      }
      
      // Ensure the user exists in the database
      try {
        await ensureUserExists(user);
      } catch (error) {
        console.error('Error ensuring user exists in database:', error);
        // Continue anyway to show profile, but log the error
      }
      
      // Create a user profile object with all available data
      const userProfile = {
        status: 'authenticated',
        ...user, // Include all user properties
      };
      
      // Send the user profile data to the client
      dataStream.writeData({
        type: 'user-profile-delta' as any, // Type assertion to bypass type checking
        content: JSON.stringify(userProfile),
      });
      
      return JSON.stringify(userProfile);
    } catch (error) {
      console.error('Error creating user profile artifact:', error);
      dataStream.writeData({
        type: 'user-profile-delta' as any, // Type assertion to bypass type checking
        content: JSON.stringify({ status: 'error', message: 'Failed to load user profile' }),
      });
      return JSON.stringify({ status: 'error', message: 'Failed to load user profile' });
    }
  },
  
  onUpdateDocument: async ({ document, description, dataStream, user }) => {
    // For user profile, we'll just refresh the data
    try {
      if (!user) {
        dataStream.writeData({
          type: 'user-profile-delta' as any, // Type assertion to bypass type checking
          content: JSON.stringify({ status: 'not-authenticated' }),
        });
        return JSON.stringify({ status: 'not-authenticated' });
      }
      
      // Ensure the user exists in the database
      try {
        await ensureUserExists(user);
      } catch (error) {
        console.error('Error ensuring user exists in database during update:', error);
        // Continue anyway to show profile, but log the error
      }
      
      const userProfile = {
        status: 'authenticated',
        ...user, // Include all user properties
      };
      
      dataStream.writeData({
        type: 'user-profile-delta' as any, // Type assertion to bypass type checking
        content: JSON.stringify(userProfile),
      });
      
      return JSON.stringify(userProfile);
    } catch (error) {
      console.error('Error updating user profile artifact:', error);
      dataStream.writeData({
        type: 'user-profile-delta' as any, // Type assertion to bypass type checking
        content: JSON.stringify({ status: 'error', message: 'Failed to update user profile' }),
      });
      return JSON.stringify({ status: 'error', message: 'Failed to update user profile' });
    }
  },
}); 