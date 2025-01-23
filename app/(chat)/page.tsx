import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

import { auth } from '../(auth)/auth';

export default async function Page() {
  const id = generateUUID();
  const session = await auth();

  let selectedModelId: string = DEFAULT_MODEL_NAME;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModel = models.find((model) => model.id === modelIdFromCookie);

  if (selectedModel) {
    const canUseModel =
      !selectedModel.requiresAuth || (selectedModel.requiresAuth && session);

    if (canUseModel) {
      selectedModelId = selectedModel.id;
    }
  }

  return (
    <>
      <Chat
        key={id}
        id={session ? id : 'guest'}
        initialMessages={[]}
        selectedModelId={selectedModelId}
        user={session?.user}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={session ? id : 'guest'} />
    </>
  );
}
