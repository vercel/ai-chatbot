// Re-export types from models.ts for compatibility
export type {
  Chat,
  DBMessage,
  Document,
  MessageVersion,
  Stream,
  Suggestion,
  User,
  Vote,
} from "./models";

import type { DBMessage, Vote } from "./models";

// Re-export the legacy deprecated types for backward compatibility
export type MessageDeprecated = DBMessage;
export type VoteDeprecated = Vote;
