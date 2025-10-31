import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { generateUUID, getTextFromMessage } from '@/lib/utils';
import { getCerebrasClient, CEREBRAS_API_KEYS } from '@/lib/cerebras';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, reasoningEffort } = requestBody as {
      id: string;
      message: ChatMessage;
      reasoningEffort: 'low' | 'medium' | 'high';
    };

    const userText = getTextFromMessage(message);

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        const textId = generateUUID();
        writer.write({ type: 'start-step' } as any);
        writer.write({ type: 'text-start', id: textId } as any);

        try {
          let attemptOk = false;
          let anyOutput = false; // reasoning or content

          for (const apiKey of CEREBRAS_API_KEYS) {
            try {
              const cerebras = getCerebrasClient(apiKey);
              const csStream = await cerebras.chat.completions.create({
                messages: [
                  {
                    role: 'system',
                    content: `You are qosmic - an assistant by qoder. Do not self-introduce or mention your creator unless the user asks directly. On greetings or generic prompts, respond naturally without stating your name. Be helpful, clear, and slightly humorous. Prefer thorough, detailed answers: 1-6 concise steps for procedures, and elaborate with specifics, caveats, edge cases, and short examples when useful. Use KaTeX for math, match the user's language, and never reveal internal model details; if asked about origins, reply: "Created by qoder." For very large or complex tasks, do not refuse due to size - propose a short plan, proceed step by step, continue as far as feasible within limits, and summarize progress with next steps if limits are reached. Refuse only illegal or unsafe requests.`,
                  },
                  { role: 'user', content: userText },
                ],
                model: 'gpt-oss-120b',
                stream: true,
                max_completion_tokens: 65_536,
                temperature: 0.7,
                top_p: 1,
                reasoning_effort: reasoningEffort ?? 'high',
              });

              let reasoningStarted = false;
              let totalChars = 0;
              const MAX_TOTAL_CHARS = 25_000;
              for await (const chunk of csStream as any) {
                const delta = chunk?.choices?.[0]?.delta ?? {};
                const content: string | undefined = delta?.content;
                const reasoning: string | undefined = delta?.reasoning;

                if (typeof reasoning === 'string' && reasoning.length > 0) {
                  anyOutput = true;
                  if (!reasoningStarted) {
                    reasoningStarted = true;
                    writer.write({ type: 'reasoning-start', id: textId } as any);
                  }
                  writer.write({
                    type: 'reasoning-delta',
                    id: textId,
                    delta: reasoning,
                  } as any);
                }

                if (typeof content === 'string' && content.length > 0) {
                  anyOutput = true;
                  totalChars += content.length;
                  if (totalChars <= MAX_TOTAL_CHARS) {
                    writer.write({ type: 'text-delta', id: textId, delta: content } as any);
                  } else {
                    writer.write({
                      type: 'text-delta',
                      id: textId,
                      delta: '\n\n[Output truncated for length]',
                    } as any);
                    break;
                  }
                }
              }
              if (reasoningStarted) {
                writer.write({ type: 'reasoning-end', id: textId } as any);
              }

              attemptOk = true;
              break; // success — stop trying more keys
            } catch (err) {
              // If we already streamed something, don't switch keys mid-stream
              if (anyOutput) {
                throw err;
              }
              // else: try next key
            }
          }

          if (!attemptOk) {
            writer.write({
              type: 'text-delta',
              id: textId,
              delta:
                'ОЙ, простите — ошибка на моей стороне. Пожалуйста, попробуйте позже.',
            } as any);
          }
        } catch (err) {
          writer.write({ type: 'error', data: String(err) } as any);
        } finally {
          writer.write({ type: 'text-end', id: textId } as any);
          writer.write({ type: 'finish-step' } as any);
          writer.write({ type: 'finish' } as any);
        }
      },
      generateId: generateUUID,
      onFinish: async () => {
        // No persistence needed for this implementation
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export function DELETE(_request: Request) {
  // Deletion endpoint disabled (no persistence)
  return Response.json({ ok: true }, { status: 200 });
}
