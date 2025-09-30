import {
  itemType,
  objectType,
  enumType,
  string,
  timestampSeconds,
  bool,
  uint,
  arrayOf,
  bytes,
  type,
} from "@stately-cloud/schema";

// ============================================
// Types
// ============================================

const chatId = type("chatId", uint);
const messageId = type("messageId", uint);
const documentId = type("documentId", uint);
const suggestionId = type("suggestionId", uint);
const streamId = type("streamId", uint);
const userId = type("userId", uint);

// ============================================
// Enums
// ============================================

/**
 * Visibility levels for chat conversations
 */
const Visibility = enumType("Visibility", {
  PRIVATE: 0,
  PUBLIC: 1,
});

/**
 * Message roles for chat participants
 */
const MessageRole = enumType("MessageRole", {
  USER: 1,
  ASSISTANT: 2,
  SYSTEM: 3,
});

/**
 * Document types
 */
const DocumentKind = enumType("DocumentKind", {
  TEXT: 0,
  CODE: 1,
  IMAGE: 2,
  SHEET: 3,
});

/**
 * Resolution status for suggestions
 */
const ResolutionStatus = enumType("ResolutionStatus", {
  PENDING: 0,
  RESOLVED: 1,
  REJECTED: 2,
});

// ============================================
// Object Types
// ============================================

/**
 * Message part structure for rich message content
 */
const MessagePart = objectType("MessagePart", {
  fields: {
    type: { type: string },
    content: { type: string, required: false },
    mimeType: { type: string, required: false },
    data: { type: bytes, required: false },
  },
});

/**
 * Message attachment structure
 */
const MessageAttachment = objectType("MessageAttachment", {
  fields: {
    name: { type: string },
    mimeType: { type: string },
    size: { type: uint },
    url: { type: string, required: false },
    data: { type: bytes, required: false },
  },
});

/**
 * App usage context for chat sessions
 */
const AppUsage = objectType("AppUsage", {
  fields: {
    app: { type: string },
    version: { type: string },
    features: { type: arrayOf(string), required: false },
    metadata: { type: string, required: false }, // JSON string for flexible metadata
  },
});

// ============================================
// Item Types
// ============================================

/**
 * User represents an authenticated user of the system
 */
itemType("User", {
  keyPath: [
    "/user-:id",
    "/email-:email", // Secondary key path for unique email lookup
  ],
  fields: {
    id: { 
      type: userId, 
      initialValue: "rand53",
    },
    email: { 
      type: string,
      valid: 'this.matches("[^@]+@[^@]+")',
    },
    // Password is optional since some users might use OAuth
    passwordHash: { 
      type: string,
      required: false,
    },
    createdAt: {
      type: timestampSeconds,
      fromMetadata: "createdAtTime",
    },
    lastModifiedAt: {
      type: timestampSeconds,
      fromMetadata: "lastModifiedAtTime",
    },
  },
});

/**
 * Chat represents a conversation thread
 */
itemType("Chat", {
  keyPath: [
    "/chat-:id",
    "/user-:userId/chat-:id", // Hierarchical path for user's chats
    "/user-:userId/visibility-:visibility/chat-:id", // Path for filtering by visibility
  ],
  fields: {
    id: { 
      type: chatId,
      initialValue: "rand53",
    },
    title: { 
      type: string,
    },
    userId: { 
      type: userId,
    },
    /**
     * Default to private
     */
    visibility: { 
        type: Visibility,
        required: false,
    },
    lastContext: { 
      type: AppUsage,
      required: false,
    },
    createdAt: {
      type: timestampSeconds,
      fromMetadata: "createdAtTime",
    },
    updatedAt: {
      type: timestampSeconds,
      fromMetadata: "lastModifiedAtTime",
    },
  },
});

/**
 * Message represents a single message in a chat conversation
 */
itemType("Message", {
  keyPath: [
    "/chat-:chatId/message-:id",
    "/message-:id", // Direct access by message ID
  ],
  fields: {
    id: { 
      type: messageId,
      initialValue: "sequence",
    },
    chatId: { 
      type: chatId,
    },
    role: { 
      type: MessageRole,
    },
    parts: { 
      type: arrayOf(MessagePart),
    },
    attachments: { 
      type: arrayOf(MessageAttachment),
      required: false,
    },
    createdAt: {
      type: timestampSeconds,
      fromMetadata: "createdAtTime",
    },
    createdAtVersion: {
      type: uint,
      fromMetadata: "createdAtVersion",
    },
  },
});

/**
 * Vote represents user feedback on messages
 */
itemType("Vote", {
  keyPath: [
    "/vote-:chatId/message-:messageId", // Lets us 
    "/message-:messageId/vote-:chatId", // Alternative access pattern
    "/chat-:chatId/message-:messageId/vote", // This is stored here so we can delete votes by listing over chat id
  ],
  fields: {
    chatId: { 
      type: chatId,
    },
    messageId: { 
      type: messageId,
    },
    isUpvoted: { 
      type: bool,
    },
    votedAt: {
      type: timestampSeconds,
      fromMetadata: "lastModifiedAtTime",
    },
  },
});

/**
 * Document represents user-created content
 * Note: We use a separate createdTimestamp field instead of metadata 
 * because metadata fields cannot be used in key paths
 */
itemType("Document", {
  keyPath: [
    "/document-:id", // Direct access by document ID
    "/user-:userId/document-:id/created-:createdTimestamp",
    "/user-:userId/kind-:kind/document-:id", // Access by kind
  ],
  fields: {
    id: { 
      type: documentId,
      initialValue: "rand53",
    },
    userId: { 
      type: userId,
    },
    title: { 
      type: string,
    },
    content: { 
      type: string,
      required: false,
    },
    /**
     * Default to TEXT
     */
    kind: { 
      type: DocumentKind,
      required: false,
    },
    // Separate timestamp field for use in key paths
    createdAt: {
      type: timestampSeconds,
    },
    updatedAt: {
      type: timestampSeconds,
      fromMetadata: "lastModifiedAtTime",
    },
  },
});

/**
 * Suggestion represents feedback or suggestions on documents
 */
itemType("Suggestion", {
  keyPath: [
    // TODO add createdAt index to this
    "/document-:documentId/suggestion-:id",
    "/user-:userId/suggestion-:id", // User's suggestions
    "/document-:documentId/status-:resolutionStatus/suggestion-:id", // Filter by resolution status (using enum)
  ],
  fields: {
    id: { 
      type: suggestionId,
      initialValue: "rand53",
    },
    documentId: { 
      type: documentId,
    },
    originalText: { 
      type: string,
    },
    suggestedText: { 
      type: string,
    },
    description: { 
      type: string,
      required: false,
    },
    /**
     * Default to PENDING
     */
    resolutionStatus: { 
      type: ResolutionStatus,
      required: false,
    },
    userId: { 
      type: userId,
    },
    createdAt: {
      type: timestampSeconds,
      fromMetadata: "createdAtTime",
    },
    resolvedAt: {
      type: timestampSeconds,
      required: false,
    },
  },
});

/**
 * Stream represents real-time streaming sessions for chats
 */
itemType("Stream", {
  keyPath: [
    "/chat-:chatId/stream-:id",
    "/stream-:id", // Direct access
  ],
  ttl: {
    source: "fromCreated",
    durationSeconds: 24 * 60 * 60, // Expire after 24 hours
  },
  fields: {
    id: { 
      type: streamId,
      initialValue: "rand53",
    },
    chatId: { 
      type: chatId,
    },
    active: {
      type: bool,
    },
    createdAt: {
      type: timestampSeconds,
      fromMetadata: "createdAtTime",
    },
    lastActivity: {
      type: timestampSeconds,
      fromMetadata: "lastModifiedAtTime",
    },
  },
});