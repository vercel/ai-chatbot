import { CoreMessage } from 'ai';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ComponentProps } from 'react';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/custom/chat';
import { getChatById } from '@/db/queries';
import { Chat as ChatSchema } from '@/db/schema';
import { DEFAULT_MODEL_NAME, models } from '@/lib/model';
import { generateUUID , convertToUIMessages } from '@/lib/utils';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ id: string | undefined }>;
}) {
  const { id } = await searchParams;
  const props = id ? await getExistingChatProps(id) : await getNewChatProps();

  return (
    <Chat
      key={props.id}
      {...props}
    />
  );
}

const getNewChatProps = async (): Promise<ComponentProps<typeof Chat>> => {
  const cookieStore = await cookies();
  const value = cookieStore.get('model')?.value;
  const selectedModelName =
    models.find((m) => m.name === value)?.name || DEFAULT_MODEL_NAME;
  const id = generateUUID();

  return {
    id,
    initialMessages: [],
    selectedModelName: selectedModelName,
  }
}

const getExistingChatProps = async (id: string): Promise<ComponentProps<typeof Chat>> => {
  const chatFromDb = await getChatById({ id });

  if (!chatFromDb) {
    notFound();
  }

  // type casting
  const chat: ChatSchema = {
    ...chatFromDb,
    messages: convertToUIMessages(chatFromDb.messages as Array<CoreMessage>),
  };

  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  if (session.user.id !== chat.userId) {
    return notFound();
  }

  const cookieStore = await cookies();
  const value = cookieStore.get('model')?.value;
  const selectedModelName =
    models.find((m) => m.name === value)?.name || DEFAULT_MODEL_NAME;

  return {
    id,
    initialMessages: chat.messages,
    selectedModelName: selectedModelName,
  }
}