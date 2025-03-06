import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { User } from '@/lib/types/auth';
import { userProfileDocumentHandler } from '@/artifacts/user-profile/server';
import { generateUUID } from '@/lib/utils';

interface GetUserProfileProps {
  user: User;
  dataStream: DataStreamWriter;
}

export const getUserProfile = ({ user, dataStream }: GetUserProfileProps) =>
  tool({
    description:
      'Retrieve and display the user profile information. Use this when the user asks about their profile, account details, or personal information.',
    parameters: z.object({}),
    execute: async () => {
      const id = generateUUID();
      const title = 'User Profile';

      // Set up the artifact
      dataStream.writeData({
        type: 'kind',
        content: 'user-profile',
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // Call the user profile document handler
      await userProfileDocumentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        user,
      });

      return `I've retrieved your profile information. You are signed in as ${user.email}.`;
    },
  }); 