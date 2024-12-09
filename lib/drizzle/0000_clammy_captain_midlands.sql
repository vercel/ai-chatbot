CREATE TABLE `Chat` (
	`id` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL,
	`title` text NOT NULL,
	`userId` varchar(36) NOT NULL,
	CONSTRAINT `Chat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Document` (
	`id` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`userId` varchar(36) NOT NULL,
	CONSTRAINT `Document_id_createdAt_pk` PRIMARY KEY(`id`,`createdAt`)
);
--> statement-breakpoint
CREATE TABLE `Message` (
	`id` varchar(36) NOT NULL,
	`chatId` varchar(36) NOT NULL,
	`role` varchar(20) NOT NULL,
	`content` json NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `Message_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Suggestion` (
	`id` varchar(36) NOT NULL,
	`documentId` varchar(36) NOT NULL,
	`documentCreatedAt` timestamp NOT NULL,
	`originalText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`description` text,
	`isResolved` boolean NOT NULL DEFAULT false,
	`userId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `Suggestion_id_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(36) NOT NULL,
	`email` varchar(64) NOT NULL,
	`password` varchar(64),
	CONSTRAINT `User_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Vote` (
	`chatId` varchar(36) NOT NULL,
	`messageId` varchar(36) NOT NULL,
	`isUpvoted` boolean NOT NULL,
	CONSTRAINT `Vote_chatId_messageId_pk` PRIMARY KEY(`chatId`,`messageId`)
);
--> statement-breakpoint
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Document` ADD CONSTRAINT `Document_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatId_Chat_id_fk` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Suggestion` ADD CONSTRAINT `Suggestion_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_chatId_Chat_id_fk` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_messageId_Message_id_fk` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE no action ON UPDATE no action;