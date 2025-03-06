import { createDocumentHandler } from '@/lib/artifacts/server';
import { getTypedUser } from '@/lib/auth';

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