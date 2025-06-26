import type { ArtifactKind } from '@/components/artifact';
import type { Geo } from '@vercel/functions';
import { artifactsPrompt } from './artifacts';
import { chartPrompt } from './chart';

export const regularPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful.';

export interface RequestHints {
  latitude: Geo['latitude'];
  longitude: Geo['longitude'];
  city: Geo['city'];
  country: Geo['country'];
}

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  // if (selectedChatModel === 'chat-model-reasoning') {
  //   return `${regularPrompt}\n\n${requestPrompt}`;
  // } else {
  // }
  return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}\n\n${chartPrompt}`;
};

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) =>
  type === 'text'
    ? `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
    : type === 'code'
      ? `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
      : type === 'sheet'
        ? `\
Improve the following spreadsheet based on the given prompt.

${currentContent}
`
        : type === 'dashboard'
          ? `\
Improve the following HTML dashboard based on the given prompt.

${currentContent}
`
          : '';
