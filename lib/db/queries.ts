import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcrypt-ts';

import {
  chat,
  message,
  user,
  vote,
  document,
  suggestion,
  type User,
  type Chat,
  stream,
  userPersona,
  userSettings,
  type UserPersona,
  type UserSettings,
  type DBMessage,
  type Suggestion,
  provider,
  providerModel,
  systemSettings,
  type SystemSettings,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Failed to create guest user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    console.error(
      'Failed to get message count by user id for the last 24 hours from database',
    );
    throw error;
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    console.error('Failed to create stream id in database');
    throw error;
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    console.error('Failed to get stream ids by chat id from database');
    throw error;
  }
}

// User Persona Queries
export async function getUserPersonas(userId: string): Promise<UserPersona[]> {
  const persona = await db
    .select()
    .from(userPersona)
    .where(eq(userPersona.userId, userId))
    .limit(1);

  return persona;
}

export async function getDefaultUserPersona(
  userId: string,
): Promise<UserPersona | null> {
  const personas = await db
    .select()
    .from(userPersona)
    .where(eq(userPersona.userId, userId))
    .limit(1);

  return personas.length > 0 ? personas[0] : null;
}

export async function createUserPersona(persona: {
  userId: string;
  name: string;
  systemMessage?: string;
  persona?: string;
}): Promise<UserPersona[]> {
  try {
    const existingPersona = await getDefaultUserPersona(persona.userId);

    if (existingPersona) {
      return await db
        .update(userPersona)
        .set({
          name: persona.name,
          systemMessage: persona.systemMessage || null,
          persona: persona.persona || null,
          updatedAt: new Date(),
        })
        .where(eq(userPersona.userId, persona.userId))
        .returning();
    }

    return await db
      .insert(userPersona)
      .values({
        userId: persona.userId,
        name: persona.name,
        systemMessage: persona.systemMessage || null,
        persona: persona.persona || null,
        isDefault: true,
      })
      .returning();
  } catch (error) {
    console.error('Failed to create user persona in database', error);
    throw error;
  }
}

export async function updateUserPersona(
  id: string,
  userId: string,
  updates: {
    name?: string;
    systemMessage?: string;
    persona?: string;
  },
): Promise<UserPersona[]> {
  try {
    return await db
      .update(userPersona)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userPersona.userId, userId))
      .returning();
  } catch (error) {
    console.error('Failed to update user persona in database', error);
    throw error;
  }
}

export async function deleteUserPersona(
  id: string,
  userId: string,
): Promise<void> {
  console.log(
    'Delete operation skipped - only one persona per user is supported',
  );
}

// User Settings Queries
export async function getUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return settings.length > 0 ? settings[0] : null;
}

export async function createOrUpdateUserSettings(
  userId: string,
  settings: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  },
): Promise<UserSettings[]> {
  // Check if settings already exist
  const existingSettings = await getUserSettings(userId);

  if (existingSettings) {
    return await db
      .update(userSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
  } else {
    return await db
      .insert(userSettings)
      .values({
        userId,
        ...settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  }
}

// Password Change Function
export async function changeUserPassword(
  userId: string,
  newPassword: string,
): Promise<User[]> {
  const hashedPassword = await hash(newPassword, 10);

  return await db
    .update(user)
    .set({
      password: hashedPassword,
    })
    .where(eq(user.id, userId))
    .returning();
}

export async function getUsers() {
  return await db.select().from(user);
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  return await db.update(user).set({ role }).where(eq(user.id, userId));
}

export async function deleteUser(userId: string) {
  // Delete all user-related data
  await db.delete(chat).where(eq(chat.userId, userId));
  await db.delete(userPersona).where(eq(userPersona.userId, userId));
  await db.delete(userSettings).where(eq(userSettings.userId, userId));

  // Finally delete the user
  return await db.delete(user).where(eq(user.id, userId));
}

// For providers
export async function getProviders() {
  return await db.select().from(provider);
}

export async function getProviderById(providerId: string) {
  const providers = await db
    .select()
    .from(provider)
    .where(eq(provider.id, providerId));

  return providers[0];
}

export async function getProviderBySlug(slug: string) {
  const providers = await db
    .select()
    .from(provider)
    .where(eq(provider.slug, slug));

  return providers[0];
}

export async function updateProvider(
  providerId: string,
  data: { name?: string; apiKey?: string; baseUrl?: string; enabled?: boolean },
) {
  return await db.update(provider).set(data).where(eq(provider.id, providerId));
}

export async function createProvider(
  name: string,
  slug: string,
  apiKey?: string,
  baseUrl?: string,
  enabled = true,
) {
  const providers = await db
    .insert(provider)
    .values({
      name,
      slug,
      apiKey,
      baseUrl,
      enabled,
    })
    .returning();

  return providers[0];
}

// For provider models
export async function getProviderModels(providerId: string) {
  return await db
    .select()
    .from(providerModel)
    .where(eq(providerModel.providerId, providerId));
}

// Fetch available models from provider APIs and sync to database
export async function fetchAvailableModelsFromProvider(providerId: string) {
  try {
    const providerData = await getProviderById(providerId);

    if (!providerData) {
      return {
        models: [],
        error: 'Provider not found',
      };
    }

    if (!providerData.apiKey) {
      // If no API key, try to return default models for this provider
      const defaultModels = getDefaultModelsForProvider(providerData.slug);
      if (defaultModels.length > 0) {
        // Create these default models in the database if they don't exist
        await syncModelsToDatabase(providerId, defaultModels);

        // Return the existing models from the database
        const existingModels = await getProviderModels(providerId);
        if (existingModels.length > 0) {
          return {
            models: existingModels.map((model) => ({
              id: model.modelId,
              name: model.name,
              type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
              existingModelId: model.id,
              enabled: model.enabled,
            })),
            error:
              'API key not configured for this provider (showing default models)',
          };
        }
      }

      return {
        models: [],
        error: 'API key not configured for this provider',
      };
    }

    if (!providerData.enabled) {
      return {
        models: [],
        error: 'This provider is currently disabled',
      };
    }

    // Default model structure
    const defaultResponse = { models: [], error: null };

    let fetchedModels = [];

    switch (providerData.slug) {
      case 'openai':
        try {
          const baseUrl = providerData.baseUrl || 'https://api.openai.com/v1';
          const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${providerData.apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API request failed with status ${response.status}: ${errorText}`,
            );
          }

          const data = await response.json();

          if (!data.data || !Array.isArray(data.data)) {
            return {
              models: [],
              error: 'Unexpected response format from OpenAI API',
            };
          }

          // Map OpenAI models to a consistent format but keep original ID
          fetchedModels = data.data.map((model: any) => ({
            id: model.id, // Keep exact ID from the API
            name: model.id,
            type: model.id.includes('gpt')
              ? 'chat'
              : model.id.includes('dall-e')
                ? 'image'
                : 'other',
          }));

          // Sync fetched models to database
          await syncModelsToDatabase(providerId, fetchedModels);
        } catch (error) {
          console.error('Failed to fetch OpenAI models:', error);
          // Even if we can't fetch, get existing models from DB
          const existingModels = await getProviderModels(providerId);
          if (existingModels.length > 0) {
            return {
              models: existingModels.map((model) => ({
                id: model.modelId,
                name: model.name,
                type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
                existingModelId: model.id,
                enabled: model.enabled,
              })),
              error: `Failed to fetch OpenAI models: ${(error as Error).message || 'Unknown error'} (showing existing models)`,
            };
          }
          return {
            models: [],
            error: `Failed to fetch OpenAI models: ${(error as Error).message || 'Unknown error'}`,
          };
        }
        break;

      case 'xai':
        try {
          const baseUrl = providerData.baseUrl || 'https://api.xai.com/v1';
          const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${providerData.apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API request failed with status ${response.status}: ${errorText}`,
            );
          }

          const data = await response.json();

          // Handle multiple potential response formats for xAI API
          let modelList: any[] = [];

          if (data.data && Array.isArray(data.data)) {
            // Format: { data: [...models] }
            modelList = data.data;
          } else if (data.models && Array.isArray(data.models)) {
            // Format: { models: [...models] }
            modelList = data.models;
          } else if (Array.isArray(data)) {
            // Format: [...models]
            modelList = data;
          } else {
            console.warn('Unrecognized xAI API response format:', data);

            // Instead of failing, use predefined models for xAI as fallback
            modelList = getDefaultModelsForProvider('xai');

            console.log('Using predefined xAI models as fallback');
          }

          // Map xAI models to a consistent format but keep exact IDs
          fetchedModels = modelList.map((model: any) => ({
            id: model.id || model.name, // Some APIs might use name as primary identifier
            name: model.name || model.id,
            type: model.type
              ? model.type
              : (model.id || '').includes('vision')
                ? 'vision'
                : (model.id || '').includes('image')
                  ? 'image'
                  : 'chat',
          }));

          // Sync fetched models to database
          await syncModelsToDatabase(providerId, fetchedModels);
        } catch (error) {
          console.error('Failed to fetch xAI models:', error);

          // Even if API call fails, get existing models from database
          const existingModels = await getProviderModels(providerId);
          if (existingModels.length > 0) {
            return {
              models: existingModels.map((model) => ({
                id: model.modelId,
                name: model.name,
                type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
                existingModelId: model.id,
                enabled: model.enabled,
              })),
              error: `Failed to fetch xAI models: ${(error as Error).message || 'Unknown error'} (showing existing models)`,
            };
          }

          // If no existing models, create default ones manually
          const defaultModels = getDefaultModelsForProvider('xai');

          // Add these default models to the database
          await syncModelsToDatabase(providerId, defaultModels);

          // Return the default models
          return {
            models: defaultModels.map((model) => ({
              id: model.id,
              name: model.name,
              type: model.type,
              enabled: false,
            })),
            error: `Failed to fetch xAI models: ${(error as Error).message || 'Unknown error'} (showing default models)`,
          };
        }
        break;

      case 'anthropic':
        try {
          // Anthropic doesn't have a /models endpoint like OpenAI, so we use predefined models
          fetchedModels = getDefaultModelsForProvider('anthropic');

          // Sync these models to the database
          await syncModelsToDatabase(providerId, fetchedModels);

          console.log(
            `Added ${fetchedModels.length} predefined Anthropic models to database`,
          );
        } catch (error) {
          console.error('Failed to add Anthropic models:', error);

          // Check for existing models
          const existingModels = await getProviderModels(providerId);
          if (existingModels.length > 0) {
            return {
              models: existingModels.map((model) => ({
                id: model.modelId,
                name: model.name,
                type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
                existingModelId: model.id,
                enabled: model.enabled,
              })),
              error: `Failed to add Anthropic models: ${(error as Error).message || 'Unknown error'} (showing existing models)`,
            };
          }

          return {
            models: [],
            error: `Failed to add Anthropic models: ${(error as Error).message || 'Unknown error'}`,
          };
        }
        break;

      case 'google':
        try {
          // Google/Gemini doesn't have an easily accessible models endpoint, so we use predefined models
          fetchedModels = getDefaultModelsForProvider('google');

          // Sync these models to the database
          await syncModelsToDatabase(providerId, fetchedModels);

          console.log(
            `Added ${fetchedModels.length} predefined Google/Gemini models to database`,
          );
        } catch (error) {
          console.error('Failed to add Google/Gemini models:', error);

          // Check for existing models
          const existingModels = await getProviderModels(providerId);
          if (existingModels.length > 0) {
            return {
              models: existingModels.map((model) => ({
                id: model.modelId,
                name: model.name,
                type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
                existingModelId: model.id,
                enabled: model.enabled,
              })),
              error: null,
            };
          }

          return {
            models: [],
            error: `Failed to add Google/Gemini models: ${(error as Error).message || 'Unknown error'}`,
          };
        }
        break;

      // Add other providers as needed
      default: {
        // For any unknown provider, try to use default models
        const defaultModels = getDefaultModelsForProvider(providerData.slug);

        if (defaultModels.length > 0) {
          // Add default models to database
          await syncModelsToDatabase(providerId, defaultModels);

          fetchedModels = defaultModels;
          console.log(
            `Added ${fetchedModels.length} default models for ${providerData.slug}`,
          );
        } else {
          return {
            models: [],
            error: `Provider type '${providerData.slug}' is not supported for model fetching`,
          };
        }
      }
    }

    // After syncing, retrieve all models from the database for this provider
    const providerModels = await getProviderModels(providerId);

    return {
      models: providerModels.map((model) => ({
        id: model.modelId,
        name: model.name,
        type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
        existingModelId: model.id,
        enabled: model.enabled,
      })),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching available models:', error);

    // Try to get existing models from database as a fallback
    try {
      const existingModels = await getProviderModels(providerId);
      if (existingModels.length > 0) {
        return {
          models: existingModels.map((model) => ({
            id: model.modelId,
            name: model.name,
            type: model.isChat ? 'chat' : model.isImage ? 'image' : 'other',
            existingModelId: model.id,
            enabled: model.enabled,
          })),
          error: `Failed to fetch models: ${(error as Error).message || 'Unknown error'} (showing existing models)`,
        };
      }
    } catch (dbError) {
      console.error('Failed to get existing models from database:', dbError);
    }

    return {
      models: [],
      error: `Failed to fetch models: ${(error as Error).message || 'Unknown error'}`,
    };
  }
}

// Helper function to get default models for different providers
function getDefaultModelsForProvider(providerSlug: string): Array<any> {
  switch (providerSlug.toLowerCase()) {
    case 'openai':
      return [
        { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat' },
        { id: 'gpt-4', name: 'GPT-4', type: 'chat' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
        { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
      ];
    case 'xai':
      return [
        { id: 'grok-2-1212', name: 'Grok-2', type: 'chat' },
        { id: 'grok-2-vision-1212', name: 'Grok-2 Vision', type: 'vision' },
        { id: 'grok-3-mini-beta', name: 'Grok-3 Mini', type: 'chat' },
        { id: 'grok-2-image', name: 'Grok-2 Image', type: 'image' },
      ];
    case 'anthropic':
      return [
        {
          id: 'claude-3.7-sonnet-20250224',
          name: 'Claude 3.7 Sonnet',
          type: 'chat',
        },
        {
          id: 'claude-3.5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet (Oct 2024)',
          type: 'chat',
        },
        {
          id: 'claude-3.5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          type: 'chat',
        },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', type: 'chat' },
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          type: 'chat',
        },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'chat' },
        { id: 'claude-2.1', name: 'Claude 2.1', type: 'chat' },
        { id: 'claude-2.0', name: 'Claude 2.0', type: 'chat' },
        { id: 'claude-instant-1.2', name: 'Claude Instant 1.2', type: 'chat' },
      ];

    case 'google':
      return [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'chat' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'chat' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', type: 'chat' },
        { id: 'gemini-1.0-ultra', name: 'Gemini 1.0 Ultra', type: 'chat' },
        { id: 'imagen-3', name: 'Imagen 3', type: 'image' },
      ];
    case 'mistral':
      return [
        { id: 'mistral-large-latest', name: 'Mistral Large', type: 'chat' },
        { id: 'mistral-medium-latest', name: 'Mistral Medium', type: 'chat' },
        { id: 'mistral-small-latest', name: 'Mistral Small', type: 'chat' },
        { id: 'open-mistral-7b', name: 'Open Mistral 7B', type: 'chat' },
      ];
    case 'groq':
      return [
        { id: 'llama3-70b-8192', name: 'Llama-3 70B', type: 'chat' },
        { id: 'llama3-8b-8192', name: 'Llama-3 8B', type: 'chat' },
        { id: 'gemma2-9b-it', name: 'Gemma-2 9B', type: 'chat' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', type: 'chat' },
      ];
    case 'cohere':
      return [
        { id: 'command-r', name: 'Command-R', type: 'chat' },
        { id: 'command-r-plus', name: 'Command-R+', type: 'chat' },
        {
          id: 'embed-english-v3.0',
          name: 'Embed English v3.0',
          type: 'embedding',
        },
      ];
    default:
      // For any other provider, return empty array
      return [];
  }
}

// Helper function to sync models from provider API to database
async function syncModelsToDatabase(providerId: string, models: Array<any>) {
  try {
    // Get existing models for this provider
    const existingModels = await getProviderModels(providerId);
    const existingModelMap = new Map(
      existingModels.map((model) => [model.modelId.toLowerCase(), model]),
    );

    // Process each fetched model
    for (const model of models) {
      // Skip models without an ID
      if (!model.id) continue;

      // Normalize the ID for storage comparison
      const modelIdLower = model.id.toLowerCase();
      const existingModel = existingModelMap.get(modelIdLower);

      if (existingModel) {
        // Update existing model if needed (e.g., update name if changed)
        await updateProviderModel(existingModel.id, {
          name: model.name || existingModel.name,
        });
      } else {
        // Create new model record (disabled by default)
        await createProviderModel(
          providerId,
          model.name || model.id,
          model.id, // Store the exact ID from the API
          model.type === 'chat' || model.type === 'vision',
          model.type === 'image',
          false, // Disabled by default
        );
      }
    }

    console.log(`Synced ${models.length} models for provider ${providerId}`);
    return true;
  } catch (error) {
    console.error('Error syncing models to database:', error);
    return false;
  }
}

export async function getEnabledChatModels() {
  return await db
    .select()
    .from(providerModel)
    .where(
      and(eq(providerModel.enabled, true), eq(providerModel.isChat, true)),
    );
}

export async function getEnabledImageModels() {
  return await db
    .select()
    .from(providerModel)
    .where(
      and(eq(providerModel.enabled, true), eq(providerModel.isImage, true)),
    );
}

export async function updateProviderModel(
  modelId: string,
  data: { name?: string; modelId?: string; enabled?: boolean; config?: any },
) {
  return await db
    .update(providerModel)
    .set(data)
    .where(eq(providerModel.id, modelId));
}

export async function createProviderModel(
  providerId: string,
  name: string,
  modelIdStr: string,
  isChat = true,
  isImage = false,
  enabled = true,
  config?: any,
) {
  const models = await db
    .insert(providerModel)
    .values({
      providerId,
      name,
      modelId: modelIdStr,
      isChat,
      isImage,
      enabled,
      config,
    })
    .returning();

  return models[0];
}

// System Settings functions
export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const settings = await db.select().from(systemSettings).limit(1);

    return settings.length > 0 ? settings[0] : null;
  } catch (error) {
    console.error('Failed to get system settings:', error);
    throw error;
  }
}

export async function updateSystemSettings(updates: {
  allowGuestUsers?: boolean;
  allowRegistration?: boolean;
  braveSearchApiKey?: string;
}): Promise<SystemSettings[]> {
  try {
    // Get the current settings record or create one if it doesn't exist
    const currentSettings = await getSystemSettings();

    if (!currentSettings) {
      // Create a new settings record
      return await db
        .insert(systemSettings)
        .values({
          ...updates,
          updatedAt: new Date(),
        })
        .returning();
    }

    // Update the existing settings record
    return await db
      .update(systemSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, currentSettings.id))
      .returning();
  } catch (error) {
    console.error('Failed to update system settings:', error);
    throw error;
  }
}

// Function to check if guest users are allowed
export async function isGuestAccessAllowed(): Promise<boolean> {
  try {
    const settings = await getSystemSettings();
    return settings?.allowGuestUsers ?? true; // Default to true if no settings exist
  } catch (error) {
    console.error('Failed to check if guest access is allowed:', error);
    return true; // Default to true in case of error
  }
}
