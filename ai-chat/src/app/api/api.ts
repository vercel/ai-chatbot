import { getAuthToken } from '@ai-chat/auth/use-auth-config';
import {
  ChatModeKeyOptions,
  type Message,
  type MessageFeedbackOptions,
  type User,
  type ChatMetadataAndMessages,
  type SendChatMessageFeedbackResponse,
  type StreamAnswerResponse,
  type HideChatResponse,
  type StreamAnswerRequestBody,
  type Chat,
  type ApiUserSettings,
  type LanguageType,
} from './models';

declare global {
  interface Window {
    _mtm: any[];
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Api {
  private static env = process.env;
  private static baseUrl = 'http://find-backend-dev.apps.ikstest.gva.icrc.priv';
  private static _correlationId: string;

  /* Helper methods */

  private static buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
      apikey: Api.env.apiKey as string,
    };
  }

  private static async request<T>(
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    payload?: any,
  ): Promise<T> {
    try {
      const options: RequestInit = {
        method,
        headers: Api.buildHeaders(),
        mode: 'cors',
      };

      if (method !== 'GET' && payload) {
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url, options);

      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      this.setCorrelationId(Api.getCorrelationIdFromHeaders(response.headers));

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      // parse without .json() since it triggers a known checkmarx false positive for a backend recommendation (HSTS header)
      const parsedResponse: T = JSON.parse(await response.text());

      return parsedResponse;
    } catch (exception) {
      throw new Error(`An error occurred during the request: ${exception}`);
    }
  }

  private static async get<T>(url: string): Promise<T> {
    return await Api.request<T>('GET', url);
  }

  private static async post<T>(url: string, payload?: any): Promise<T> {
    return await Api.request<T>('POST', url, payload);
  }

  private static async patch<T>(url: string, payload?: any): Promise<T> {
    return await Api.request<T>('PATCH', url, payload);
  }

  private static buildUrlWithParams(
    baseUrl: string,
    params: Record<string, any> = {},
  ): string {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }

    return queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  }

  /* API endpoints & actions */
  private static Endpoints = {
    // FIXME
    // Health: `${Api.env.apiUrl}/health`,
    Health: `${Api.baseUrl}/health`,
    User: {
      Upsert: `${Api.baseUrl}/user-service/user`,
      TOUUpdate: (version: string) =>
        `${Api.baseUrl}/user-service/user/tou/${encodeURIComponent(version)}`,
      UserSettings: `${Api.baseUrl}/user-service/user/settings`,
      UpdateUserSettings: `${Api.baseUrl}/user-service/user/settings`,
      LanguageType: `${Api.baseUrl}/user-service/user/tou/language`,
    },
    Chat: {
      Mode: (chatModeKey?: string) =>
        `${Api.baseUrl}/chat-service/chat/mode/${chatModeKey ?? ''}`,
      ById: (chatId: string) => `${Api.baseUrl}/chat-service/chat/id/${chatId}`,
      Hide: (chatId: string) =>
        `${Api.baseUrl}/chat-service/chat/hide/${chatId}`,
      Stream: `${Api.baseUrl}/chat-service/chat/stream/start`,
      StopStream: (chatId: string) =>
        `${Api.baseUrl}/chat-service/chat/stream/stop/${chatId}`,
    },
    Message: {
      FeedbackUpdate: `${Api.baseUrl}/chat-service/message/feedback`,
    },
  };

  private static getChatByIdQueryParams(
    overrides: Partial<Record<string, any>> = {},
  ): Record<string, any> {
    const defaultParams = {
      with_chat: true,
      with_messages: false,
    };
    return { ...defaultParams, ...overrides };
  }

  /**
   * Gets the correlation ID from the response headers.
   * @param headers Response headers.
   * @returns The correlation ID.
   */
  private static getCorrelationIdFromHeaders(headers: Headers): string {
    return headers.get('x-correlation-id')?.toString() ?? '';
  }

  /**
   * Sets the correlation ID.
   * @param id The id as a string.
   */
  private static setCorrelationId(id: string): void {
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    this._correlationId = id;
  }

  public static async getHealth() {
    return await Api.post<any>(Api.Endpoints.Health);
  }

  /**
   * Gets the Correlation ID.
   * @returns The correlation ID.
   */
  public static getCorrelationId(): string {
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    return this._correlationId;
  }

  // create and/or retrieve a User
  public static async postUser(): Promise<User> {
    return await Api.post<User>(Api.Endpoints.User.Upsert);
  }

  // accept terms of use
  public static async postTOU(version: string): Promise<string> {
    return await Api.post<string>(Api.Endpoints.User.TOUUpdate(version));
  }

  /**
   * Gets the User Settings.
   * @returns Promise to get the User Settings.
   */
  public static async getUserSettings(): Promise<ApiUserSettings> {
    return await Api.get<ApiUserSettings>(Api.Endpoints.User.UserSettings);
  }

  /**
   * Sets the User Settings.
   * @param payload The proposed payload for User Settings.
   * @returns Promise to post the User Settings.
   */
  public static async postUserSettings(
    payload: ApiUserSettings,
  ): Promise<ApiUserSettings> {
    return await Api.post<ApiUserSettings>(
      Api.Endpoints.User.UpdateUserSettings,
      payload,
    );
  }

  // sets the chosen language
  public static async postLanguageType(
    payload?: LanguageType,
  ): Promise<LanguageType> {
    return await Api.post<LanguageType>(
      Api.Endpoints.User.LanguageType,
      payload,
    );
  }

  // get list of previous chat sessions (just the metadata, with title, etc.)
  public static async getChats(
    chatModeKey?: ChatModeKeyOptions,
  ): Promise<Chat[]> {
    return await Api.get<Chat[]>(Api.Endpoints.Chat.Mode(chatModeKey));
  }

  // get all messages of an existing chat session without the chat metadata (already fetched for previous chats list)
  public static async getChatMessages(chatId: string): Promise<Message[]> {
    const url = Api.buildUrlWithParams(
      Api.Endpoints.Chat.ById(chatId),
      Api.getChatByIdQueryParams({ with_chat: false, with_messages: true }),
    );
    return await Api.get<Message[]>(url);
  }

  // get all messages of a chat session, along with its metadata
  public static async getChatMetadataAndMessages(
    chatId: string,
  ): Promise<ChatMetadataAndMessages> {
    const url = Api.buildUrlWithParams(
      Api.Endpoints.Chat.ById(chatId),
      Api.getChatByIdQueryParams({ with_chat: true, with_messages: true }),
    );
    return await Api.get<ChatMetadataAndMessages>(url);
  }

  // send feedback to a chat message
  public static async sendChatMessageFeedback(
    messageId: string,
    userFeedback: MessageFeedbackOptions,
    commentFeedback?: string,
  ): Promise<SendChatMessageFeedbackResponse> {
    const payload = {
      message_id: messageId,
      feedback: userFeedback,
      comment_feedback: commentFeedback,
    };
    return await Api.patch<SendChatMessageFeedbackResponse>(
      Api.Endpoints.Message.FeedbackUpdate,
      payload,
    );
  }

  // hide a chat
  public static async hideChat(chatId: string): Promise<HideChatResponse> {
    return await Api.patch<HideChatResponse>(Api.Endpoints.Chat.Hide(chatId));
  }

  // stream an answer for a user prompt
  public static async streamAnswer(
    onStream: (chunk: string, chatId: string | null) => void,
    userPrompt: string,
    chatModeKey: ChatModeKeyOptions,
    localSessionId: number,
    currentLocalSessionIdRef: React.MutableRefObject<number>,
    chatId?: string,
    languageModelKey?: string,
    knowledgeBaseKey?: string,
  ): Promise<StreamAnswerResponse> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    try {
      const payload: StreamAnswerRequestBody = {
        chat_id: chatId ?? null,
        user_prompt: userPrompt,
        chat_mode_key: chatModeKey,
        language_model_key:
          chatModeKey === ChatModeKeyOptions.Generic ? languageModelKey : '',
        knowledge_base_key:
          chatModeKey === ChatModeKeyOptions.Documents ? knowledgeBaseKey : '',
      };

      const response = await fetch(Api.Endpoints.Chat.Stream, {
        method: 'POST',
        headers: Api.buildHeaders(),
        mode: 'cors',
        body: JSON.stringify(payload),
        signal,
      });

      Api.setCorrelationId(Api.getCorrelationIdFromHeaders(response.headers));

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      // extract new chat ID from response headers
      // should exist if we didnt pass any chat id (means we're streaming an answer for a new chat)
      const newChatId = response.headers.get('chat_id');

      // start streaming answer chunks
      const reader = response.body?.getReader?.();
      const decoder = new TextDecoder('utf-8');
      let accumulatedAnswer = '';

      if (reader) {
        let done = false;
        while (!done) {
          // signal streaming disconnect to backend if there's a change in session id during ongoing stream
          if (currentLocalSessionIdRef.current !== localSessionId) {
            abortController.abort();

            return {
              userPrompt,
              finalAnswer: accumulatedAnswer,
              newChatId,
            };
          }

          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedAnswer += chunk;
          onStream(chunk, newChatId);
          if (done === true) {
            window._mtm = window._mtm || [];
            window._mtm.push({
              event: 'answer-complete',
            });
          }
        }
      }
      return {
        userPrompt,
        finalAnswer: accumulatedAnswer,
        newChatId,
      };
    } catch (exception) {
      throw new Error(`An error occurred while streaming data: ${exception}`);
    }
  }

  // attempt to stop an ongoing streaming answer of a given chat
  public static async stopStreamByChatId(
    chatId: string,
  ): Promise<string | null> {
    return await Api.post<string | null>(Api.Endpoints.Chat.StopStream(chatId));
  }
}
