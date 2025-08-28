'use client';

import { Action, Actions } from '@/components/elements/actions';
import {
  Conversation,
  ConversationContent,
} from '@/components/elements/conversation';
import { Message, MessageContent } from '@/components/elements/message';
import {
  CopyIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';

const messages: {
  key: string;
  from: 'user' | 'assistant';
  content: string;
  avatar: string;
  name: string;
}[] = [
  {
    key: nanoid(),
    from: 'user',
    content: 'Hello, how are you?',
    avatar: 'https://github.com/haydenbleasel.png',
    name: 'Hayden Bleasel',
  },
  {
    key: nanoid(),
    from: 'assistant',
    content: 'I am fine, thank you!',
    avatar: 'https://github.com/openai.png',
    name: 'OpenAI',
  },
];

const Example = () => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleRetry = () => {};

  const handleCopy = () => {};

  const handleShare = () => {};

  const actions = [
    {
      icon: RefreshCcwIcon,
      label: 'Retry',
      onClick: handleRetry,
    },
    {
      icon: ThumbsUpIcon,
      label: 'Like',
      onClick: () => setLiked(!liked),
    },

    {
      icon: ThumbsDownIcon,
      label: 'Dislike',
      onClick: () => setDisliked(!disliked),
    },
    {
      icon: CopyIcon,
      label: 'Copy',
      onClick: () => handleCopy(),
    },
    {
      icon: ShareIcon,
      label: 'Share',
      onClick: () => handleShare(),
    },
  ];

  return (
    <Conversation className="relative w-full">
      <ConversationContent>
        {messages.map((message) => (
          <Message
            className={`flex flex-col gap-2 ${message.from === 'assistant' ? 'items-start' : 'items-end'}`}
            from={message.from}
            key={message.key}
          >
            <MessageContent>{message.content}</MessageContent>
            {message.from === 'assistant' && (
              <Actions className="mt-2">
                {actions.map((action) => (
                  <Action key={action.label} label={action.label}>
                    <action.icon className="size-4" />
                  </Action>
                ))}
              </Actions>
            )}
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
};

export default Example;
