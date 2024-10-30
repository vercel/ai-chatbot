import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';

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
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      user={session?.user}
    />
  );
}
