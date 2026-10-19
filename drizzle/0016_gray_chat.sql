CREATE TABLE `poll_ballots` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`choice` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `town_polls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_account_vote` ON `poll_ballots` (`poll_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `poll_resident_vote` ON `poll_ballots` (`poll_id`,`username`);--> statement-breakpoint
CREATE TABLE `town_polls` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`options` text NOT NULL,
	`created_at` integer NOT NULL,
	`closes_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE set null
);
