'use client';

import { Action, Actions } from '@/components/elements/actions';
import { Message, MessageContent } from '@/components/elements/message';
import {
  CopyIcon,
  HeartIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react';
import { useState } from 'react';

const Example = () => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const responseContent = `This is a response from an assistant.
  
Try hovering over this message to see the actions appear!`;

  const handleRetry = () => {
    console.log('Retrying request...');
  };

  const handleCopy = (content?: string) => {
    console.log('Copied:', content);
  };

  const handleShare = (content?: string) => {
    console.log('Sharing:', content);
  };

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
      onClick: () => handleCopy(responseContent),
    },
    {
      icon: ShareIcon,
      label: 'Share',
      onClick: () => handleShare(responseContent),
    },
    {
      icon: HeartIcon,
      label: 'Favorite',
      onClick: () => setFavorited(!favorited),
    },
  ];

  return (
    <Message className="group flex flex-col items-start gap-2" from="assistant">
      <MessageContent>{responseContent}</MessageContent>
      <Actions className="mt-2 opacity-0 group-hover:opacity-100">
        {actions.map((action) => (
          <Action key={action.label} label={action.label}>
            <action.icon className="size-3" />
          </Action>
        ))}
      </Actions>
    </Message>
  );
};

export default Example;
