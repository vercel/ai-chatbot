import mongoose, { type Document as MongoDocument, Schema } from "mongoose";
import type { AppUsage } from "../usage";

// User Interface and Schema
export interface IUser extends MongoDocument {
  _id: string;
  id: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    id: { type: String, unique: true, required: true },
    email: { type: String, required: true, maxlength: 64 },
    password: { type: String, maxlength: 64 },
  },
  {
    timestamps: true,
  }
);

// Chat Interface and Schema
export interface IChat extends MongoDocument {
  _id: string;
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: "public" | "private";
  lastContext?: AppUsage | null;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    id: { type: String, unique: true, required: true },
    createdAt: { type: Date, required: true },
    title: { type: String, required: true },
    userId: { type: String, required: true, ref: "User" },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      required: true,
    },
    lastContext: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

// Message Interface and Schema
export interface IMessage extends MongoDocument {
  _id: string;
  id: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    id: { type: String, unique: true, required: true },
    chatId: { type: String, required: true, ref: "Chat" },
    role: { type: String, required: true },
    parts: { type: Schema.Types.Mixed, required: true },
    attachments: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Vote Interface and Schema
export interface IVote extends MongoDocument {
  _id: string;
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    chatId: { type: String, required: true, ref: "Chat" },
    messageId: { type: String, required: true, ref: "Message" },
    isUpvoted: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  }
);

// Ensure unique constraint on chatId + messageId
voteSchema.index({ chatId: 1, messageId: 1 }, { unique: true });

// Document Interface and Schema
export interface IDocument extends MongoDocument {
  _id: string;
  id: string;
  createdAt: Date;
  title: string;
  content?: string;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    id: { type: String, required: true },
    createdAt: { type: Date, required: true },
    title: { type: String, required: true },
    content: { type: String },
    kind: {
      type: String,
      enum: ["text", "code", "image", "sheet"],
      default: "text",
      required: true,
    },
    userId: { type: String, required: true, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Ensure unique constraint on id + createdAt
documentSchema.index({ id: 1, createdAt: 1 }, { unique: true });

// Suggestion Interface and Schema
export interface ISuggestion extends MongoDocument {
  _id: string;
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const suggestionSchema = new Schema<ISuggestion>(
  {
    id: { type: String, required: true },
    documentId: { type: String, required: true },
    documentCreatedAt: { type: Date, required: true },
    originalText: { type: String, required: true },
    suggestedText: { type: String, required: true },
    description: { type: String },
    isResolved: { type: Boolean, default: false, required: true },
    userId: { type: String, required: true, ref: "User" },
    createdAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Stream Interface and Schema
export interface IStream extends MongoDocument {
  _id: string;
  id: string;
  chatId: string;
  createdAt: Date;
  updatedAt: Date;
}

const streamSchema = new Schema<IStream>(
  {
    id: { type: String, required: true },
    chatId: { type: String, required: true, ref: "Chat" },
    createdAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Create models
export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export const ChatModel =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
export const MessageModel =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
export const VoteModel =
  mongoose.models.Vote || mongoose.model<IVote>("Vote", voteSchema);
export const DocumentModel =
  mongoose.models.Document ||
  mongoose.model<IDocument>("Document", documentSchema);
export const SuggestionModel =
  mongoose.models.Suggestion ||
  mongoose.model<ISuggestion>("Suggestion", suggestionSchema);
export const StreamModel =
  mongoose.models.Stream || mongoose.model<IStream>("Stream", streamSchema);

// Plain data types for SWR usage (without Mongoose methods)
export type User = {
  _id: string;
  id: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Chat = {
  _id: string;
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: "public" | "private";
  lastContext?: AppUsage | null;
  updatedAt: Date;
};

export type DBMessage = {
  _id: string;
  id: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: Date;
  updatedAt: Date;
};

export type Vote = {
  _id: string;
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

export type Document = {
  _id: string;
  id: string;
  createdAt: Date;
  title: string;
  content?: string;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
};

export type Suggestion = {
  _id: string;
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
};

export type Stream = {
  _id: string;
  id: string;
  externalId: string;
};
