-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `achievements_awarded` (
	`id` int AUTO_INCREMENT NOT NULL,
	`achievement_id` int NOT NULL,
	`pax_id` varchar(255) NOT NULL,
	`date_awarded` date NOT NULL,
	`created` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `achievements_awarded_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `achievements_list` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL,
	`verb` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	CONSTRAINT `achievements_list_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `achievements_view` (
	`pax` varchar(45) NOT NULL,
	`pax_id` varchar(45) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL,
	`date_awarded` date NOT NULL
);
--> statement-breakpoint
CREATE TABLE `aos` (
	`channel_id` varchar(45) NOT NULL,
	`ao` varchar(45) NOT NULL,
	`channel_created` int NOT NULL,
	`archived` tinyint NOT NULL,
	`backblast` tinyint,
	`site_q_user_id` varchar(45),
	CONSTRAINT `aos_channel_id` PRIMARY KEY(`channel_id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_view` (
	`Date` varchar(45) NOT NULL,
	`AO` varchar(45),
	`PAX` varchar(45),
	`Q` varchar(45)
);
--> statement-breakpoint
CREATE TABLE `backblast` (
	`Date` date NOT NULL,
	`AO` varchar(45),
	`Q` varchar(45) NOT NULL,
	`CoQ` varchar(45),
	`pax_count` int,
	`fngs` varchar(45),
	`fng_count` int,
	`backblast` longtext
);
--> statement-breakpoint
CREATE TABLE `bd_attendance` (
	`timestamp` varchar(45),
	`ts_edited` varchar(45),
	`user_id` varchar(45) NOT NULL,
	`ao_id` varchar(45) NOT NULL,
	`date` varchar(45) NOT NULL,
	`q_user_id` varchar(45) NOT NULL,
	`json` json,
	CONSTRAINT `bd_attendance_q_user_id_user_id_ao_id_date` PRIMARY KEY(`q_user_id`,`user_id`,`ao_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `beatdown_info` (
	`Date` date NOT NULL,
	`AO` varchar(45),
	`Q` varchar(45),
	`Q_Is_App` tinyint DEFAULT 0,
	`CoQ` varchar(45),
	`pax_count` int,
	`fngs` varchar(45),
	`fng_count` int
);
--> statement-breakpoint
CREATE TABLE `beatdowns` (
	`timestamp` varchar(45),
	`ts_edited` varchar(45),
	`ao_id` varchar(45) NOT NULL,
	`bd_date` date NOT NULL,
	`q_user_id` varchar(45) NOT NULL,
	`coq_user_id` varchar(45),
	`pax_count` int,
	`backblast` longtext,
	`backblast_parsed` longtext,
	`fngs` varchar(45),
	`fng_count` int,
	`json` json,
	CONSTRAINT `beatdowns_ao_id_bd_date_q_user_id` PRIMARY KEY(`ao_id`,`bd_date`,`q_user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` varchar(45) NOT NULL,
	`user_name` varchar(45) NOT NULL,
	`real_name` varchar(45) NOT NULL,
	`phone` varchar(45),
	`email` varchar(45),
	`start_date` date,
	`app` tinyint NOT NULL DEFAULT 0,
	`json` json,
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `achievements_awarded` ADD CONSTRAINT `fk_achievement_id` FOREIGN KEY (`achievement_id`) REFERENCES `achievements_list`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `fk_bd_attendance_aos1_idx` ON `bd_attendance` (`ao_id`);--> statement-breakpoint
CREATE INDEX `fk_beatdowns_users1_idx` ON `beatdowns` (`q_user_id`);
*/