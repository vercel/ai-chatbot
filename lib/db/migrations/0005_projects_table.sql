CREATE TABLE `Project` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `userId` text NOT NULL,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Project_userId_idx` ON `Project` (`userId`);