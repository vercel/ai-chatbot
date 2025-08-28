'use client';

import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/elements/message';
import { Response } from '@/components/elements/response';
import { useEffect, useState } from 'react';

const assistantMessageTokens = [
  'To',
  ' get',
  ' the',
  ' **',
  'weather',
  ' in',
  ' Tokyo',
  '**',
  ' using',
  ' an',
  ' API',
  ' call',
  ',',
  ' you',
  ' can',
  ' use',
  ' the',
  ' [',
  'OpenWeatherMap',
  '](',
  'https://openweathermap.org/api',
  ')',
  ' API',
  '.',
  ' After',
  ' signing',
  ' up',
  ',',
  ' you',
  ' can',
  ' make',
  ' a',
  ' request',
  ' to',
  ' their',
  ' API',
  ':',
  '\n\n',
  '```',
  'bash',
  '\n',
  'curl',
  ' -X',
  ' GET',
  ' "https://api.openweathermap.org/data/2.5/weather?q=Tokyo&appid=YOUR_API_KEY"',
  ' \\',
  '\n',
  '  --header',
  ' "Content-Type:',
  ' application/json"',
  ' \\',
  '\n',
  '  --header',
  ' "Accept:',
  ' application/json"',
  '\n',
  '```',
  '\n\n',
  'This',
  ' will',
  ' return',
  ' a',
  ' JSON',
  ' object',
  ' with',
  ' the',
  ' weather',
  ' data',
  ' for',
  ' Tokyo',
  '.',
];

const Example = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    let currentContent = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < assistantMessageTokens.length) {
        currentContent += assistantMessageTokens[index];
        setContent(currentContent);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Message from="user">
        <MessageContent>
          <Response>What is the weather in Tokyo?</Response>
        </MessageContent>
        <MessageAvatar
          name="Hayden Bleasel"
          src="https://github.com/haydenbleasel.png"
        />
      </Message>
      <Message from="assistant">
        <MessageContent>
          <Response>{content}</Response>
        </MessageContent>
        <MessageAvatar name="OpenAI" src="https://github.com/openai.png" />
      </Message>
    </>
  );
};

export default Example;
