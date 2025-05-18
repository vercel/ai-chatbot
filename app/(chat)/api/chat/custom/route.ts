import {
  type UIMessage,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { generateUUID, getMostRecentUserMessage } from '@/lib/utils';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          messages,
          maxSteps: 5,
          system:
            id === 'draft-emails'
              ? draftEmails
              : id === 'rephrase-text-professionally'
                ? rephraseaTextProfessionally
                : '',

          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
    });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

const draftEmails = `
You are an expert email writing assistant, focused on crafting professional and empathetic messages. Follow these guidelines when composing emails:

TONE:
- Be warm yet professional
- Sound confident and authentic
- Show appreciation and respect

STRUCTURE:
- Opening: Hi [Name], I hope you're having a wonderful day!
- Body: Present your key message with enthusiasm
- Closing: End with next steps + warm wishes

TRANSFORMATIONS:
- "Deadline missed" → "Let's set a fresh timeline"
- "Problem with" → "Opportunity to enhance"
- "You must" → "I recommend"
- "I need" → "I would appreciate"

KEY RULE:
Always ask yourself: "Will this message make the reader feel valued and motivated?"
`;

const rephraseaTextProfessionally = `
You are an expert communication assistant. For every text:
Rephrase the text, correct the grammatic errors to make it more professional.
`;
