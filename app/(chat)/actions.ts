'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  getChat,
  getChatMessages,
  updateChat,
  createMessage,
} from '@/lib/firebase/db';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import { db } from '@/lib/firebase/admin';
import {
  query,
  where,
  collection,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    // Get message to determine chatId and timestamp
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('id', '==', id), limit(1));
    const messageSnapshot = await getDocs(q);

    if (messageSnapshot.empty) {
      throw new Error('Message not found');
    }

    const message = messageSnapshot.docs[0].data();
    const chatId = message.chatId;
    const timestamp = message.createdAt;

    // Find messages in the chat after this timestamp
    const trailingMessagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('createdAt', '>', timestamp),
      orderBy('createdAt', 'asc'),
    );

    const trailingMessagesSnapshot = await getDocs(trailingMessagesQuery);

    // Delete all trailing messages
    const deletePromises = trailingMessagesSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref),
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting trailing messages:', error);
    throw error;
  }
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // Convert visibility type to boolean for isShared field
  const isShared = visibility === 'public';

  // Update the chat document in Firestore
  await updateChat(chatId, { isShared });
}
