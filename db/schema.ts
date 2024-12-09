import { InferSelectModel } from "drizzle-orm";
import {
	mysqlTable,
	varchar,
	timestamp,
	json,
	text,
	primaryKey,
	boolean,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("User", {
	id: varchar("id", { length: 36 }).primaryKey().notNull(),
	email: varchar("email", { length: 64 }).notNull(),
	password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = mysqlTable("Chat", {
	id: varchar("id", { length: 36 }).primaryKey().notNull(),
	createdAt: timestamp("createdAt").notNull(),
	title: text("title").notNull(),
	userId: varchar("userId", { length: 36 })
		.notNull()
		.references(() => user.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = mysqlTable("Message", {
	id: varchar("id", { length: 36 }).primaryKey().notNull(),
	chatId: varchar("chatId", { length: 36 })
		.notNull()
		.references(() => chat.id),
	role: varchar("role", { length: 20 }).notNull(),
	content: json("content").notNull(),
	createdAt: timestamp("createdAt").notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = mysqlTable(
	"Vote",
	{
		chatId: varchar("chatId", { length: 36 })
			.notNull()
			.references(() => chat.id),
		messageId: varchar("messageId", { length: 36 })
			.notNull()
			.references(() => message.id),
		isUpvoted: boolean("isUpvoted").notNull(),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.chatId, table.messageId] }),
		};
	},
);

export type Vote = InferSelectModel<typeof vote>;

export const document = mysqlTable(
	"Document",
	{
		id: varchar("id", { length: 36 }).notNull(),
		createdAt: timestamp("createdAt").notNull(),
		title: text("title").notNull(),
		content: text("content"),
		userId: varchar("userId", { length: 36 })
			.notNull()
			.references(() => user.id),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.id, table.createdAt] }),
		};
	},
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = mysqlTable(
	"Suggestion",
	{
		id: varchar("id", { length: 36 }).notNull(),
		documentId: varchar("documentId", { length: 36 }).notNull(),
		documentCreatedAt: timestamp("documentCreatedAt").notNull(),
		originalText: text("originalText").notNull(),
		suggestedText: text("suggestedText").notNull(),
		description: text("description"),
		isResolved: boolean("isResolved").notNull().default(false),
		userId: varchar("userId", { length: 36 })
			.notNull()
			.references(() => user.id),
		createdAt: timestamp("createdAt").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.id] }),
		documentRef: primaryKey({
			columns: [table.documentId, table.documentCreatedAt],
			name: "document_ref",
		}),
	}),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
