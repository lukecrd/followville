CREATE TABLE `buildings` (
	`id` text PRIMARY KEY NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`kind` text NOT NULL,
	`username` text,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plot_unique` ON `buildings` (`x`,`y`);--> statement-breakpoint
CREATE UNIQUE INDEX `resident_unique` ON `buildings` (`username`);--> statement-breakpoint
CREATE TABLE `town_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`coins` integer NOT NULL
);
