'use client';

import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/elements/message';
import { nanoid } from 'nanoid';

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
];

const Example = () => (
  <>
    {messages.map(({ content, ...message }) => (
      <Message from={message.from} key={message.key}>
        <MessageContent>{content}</MessageContent>
        <MessageAvatar name={message.name} src={message.avatar} />
      </Message>
    ))}
  </>
);

export default Example;
