import { motion } from 'framer-motion';
import { useState } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { PreviewMessage } from './message';
import { UIBlock } from './block';
import Image from 'next/image';

const introMessages = [
  'Hey 👋 I’m Aura, your career coach.',
  'Let’s find a workplace where you can truly thrive.',
  'I’ll ask you a few questions to get to know your values and work style.',
];

export const Overview = () => {
  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();
  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <div className="flex flex-row justify-center gap-4 items-center">
          <Image src="/images/aura.png" alt="Aura" height={150} width={150} />
        </div>
        <div className="text-start flex flex-col gap-4">
          {introMessages.map((message, index) => (
            <PreviewMessage
              key={index}
              vote={undefined}
              isLoading={false}
              block={block}
              setBlock={setBlock}
              chatId=""
              message={{
                role: 'assistant',
                content: message,
                id: index.toString(),
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
