CREATE TABLE `player_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_username_unique` ON `player_accounts` (`username`);--> statement-breakpoint
CREATE TABLE `resident_invites` (
	`username` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_token_unique` ON `resident_invites` (`token_hash`);--> statement-breakpoint
ALTER TABLE `town_settings` ADD `map_size` integer DEFAULT 24 NOT NULL;