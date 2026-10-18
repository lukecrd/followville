CREATE TABLE `daily_missions` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`day` text NOT NULL,
	`mission_id` text NOT NULL,
	`building_id` text,
	`started_at` integer NOT NULL,
	`ready_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`claimed_at` integer,
	`reward` integer NOT NULL,
	`from_x` integer NOT NULL,
	`from_y` integer NOT NULL,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_mission_unique` ON `daily_missions` (`username`,`day`,`mission_id`);--> statement-breakpoint
CREATE TABLE `neighborhood_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`garden_id` text,
	`item` text NOT NULL,
	`title` text NOT NULL,
	`district` text NOT NULL,
	`goal` integer NOT NULL,
	`raised` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`garden_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `garden_project_unique` ON `neighborhood_projects` (`garden_id`,`item`);--> statement-breakpoint
CREATE TABLE `project_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`username` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `neighborhood_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
