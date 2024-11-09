import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { createUser } from '@/db/queries';
import { generateUUID } from '@/lib/utils';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const userId = cookieStore.get('user')?.value ?? '';

  // if (!userId) {
  //   const createdUsers = await createUser();
  //   const createdUser = createdUsers[0];
  //   cookieStore.set('user', createdUser.id);
  //   console.log({ createdUser });
  // }

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
    />
  );
}
