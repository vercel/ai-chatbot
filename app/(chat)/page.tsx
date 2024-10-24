import { cookies } from 'next/headers';

import { Chat } from '@/components/custom/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/model';
import { generateUUID } from '@/lib/utils';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const value = cookieStore.get('model')?.value;
  const selectedModelName =
    models.find((m) => m.name === value)?.name || DEFAULT_MODEL_NAME;

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelName={selectedModelName}
    />
  );
}
