export enum ChatModeKeyOptions {
  Generic = 'generic',
  Documents = 'documents',
  // Semantic = "semantic"
}

export enum KnowledgeBaseKeyOptions {
  Health = 'health',
  Logistic = 'logistic',
  FinanceAndAdministrationDepartment = 'fad',
  EconomicSecurity = 'ecosec',
  CentralTracingAgency = 'cta',
  PeopleAndCulture = 'pac',
  PlanningForResults = 'pfr',
  ArtificialIntelligence = 'ai',
  ProtectionPolicy = 'prot',
  InformationAndCommunicationTechnologiesInField = 'ictfield',
}

export enum LanguageModelKeyOptions {
  GPT_4 = 'gpt-4-vision',
  Llama_4 = 'llama-4-scout-17b-16e',
}

export enum LanguageKeyOptions {
  English = 'en',
  Espanol = 'es',
  Francais = 'fr',
}

export enum ThemeOptions {
  Light = 'light',
  Dark = 'dark',
}

export enum MessageFeedbackOptions {
  Neutral = 'neutral',
  Up = 'positive',
  Down = 'negative',
}

export enum MessageRoles {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
}

export enum SourceFileTypes {
  Pdf = 'application/pdf',
  Docx = 'application/docx',
  Txt = 'application/txt',
}

export interface ChatMode {
  key: ChatModeKeyOptions;
  display_name: string;
  description: string;
  short_description?: string;
}

export interface LanguageModel {
  key: LanguageModelKeyOptions;
  display_name: string;
  description?: string;
  short_description?: string;
  examples?: string[];
}

export interface KnowledgeBase {
  key: KnowledgeBaseKeyOptions;
  display_name: string;
  description?: string;
  short_description?: string;
  examples?: string[];
}

export interface UserSettings {
  models_list: LanguageModel[];
  knowledge_bases: KnowledgeBase[];
  chat_modes: ChatMode[];
}

export interface TOUProps {
  content?: string;
  valid: boolean;
  version?: string;
}

export interface User {
  id: string;
  created_at?: string;
  updated_at?: string;
  uniquename: string; // Azure AD unique name, usually contains email
  user_settings: UserSettings;
  tou: TOUProps;
}

export interface Chat {
  id: string;
  created_at?: string;
  updated_at?: string;
  title: string;
  hidden: boolean;
  chat_mode_key: ChatModeKeyOptions;
  knowledge_base: KnowledgeBase | null;
  source_limit: number;
}

export interface Source {
  chunk_id: string;
  creation_date: string;
  file_name: string;
  file_type: SourceFileTypes | string;
  file_uri: string;
  last_ingestion_date: string;
  last_modified_date: string;
  page_label: string;
  platform_display_name: string;
  relevance: number;
  text: string;
}

export interface Message {
  id: string;
  created_at?: string;
  updated_at?: string;
  content: string;
  role: MessageRoles;
  tokens: number;
  feedback: MessageFeedbackOptions;
  comment_feedback?: string;
  sources: Record<number, Source> | null;
  model: string | null;
  temperature: number | null;
  max_tokens: number | null;
}

export interface ChatMetadataAndMessages extends Chat {
  messages: Message[];
}

export interface StreamAnswerRequestBody {
  chat_id?: string | null;
  user_prompt: string;
  chat_mode_key: ChatModeKeyOptions;
  language_model_key?: string;
  knowledge_base_key?: string;
  source_limit?: 0 | 1 | 2 | 3 | 4 | 5; // default: 5
}

export interface StreamAnswerResponse {
  userPrompt: string;
  finalAnswer: string;
  newChatId: string | null;
}

export interface SendChatMessageFeedbackResponse {
  raw: any;
  affected: number;
  generated_maps: any;
}

export interface HideChatResponse {
  raw: any;
  affected: number;
  generated_maps: any;
}

export interface LanguageOption {
  key: LanguageKeyOptions;
  display_name: string;
}

export interface UserLanguageOption extends LanguageOption {
  description?: string;
  short_description?: string;
}

export interface ApiUserSettings {
  language?: string;
  theme?: string;
  default_chat_mode?: ChatModeKeyOptions;
  default_knowledge_base?: string;
  default_model?: string;
}

export interface LanguageType {
  language?: string;
  content?: string;
  valid?: boolean;
}
