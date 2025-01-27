import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[{ id: generateUUID(), content: "Hi Mr Pilot, Please briefly describe your squawk and the aircraft type. (at any time during conversation if you think you provide all the info or it should be clear enough, you can simply type 'Exit' to end the conversation)", role: "assistant" }]}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
