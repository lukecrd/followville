CREATE TABLE `garden_decorations` (
	`id` text PRIMARY KEY NOT NULL,
	`garden_id` text NOT NULL,
	`username` text NOT NULL,
	`item` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `garden_item_unique` ON `garden_decorations` (`garden_id`,`item`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`item` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_unique` ON `purchases` (`username`,`item`);--> statement-breakpoint
CREATE TABLE `residents` (
	`username` text PRIMARY KEY NOT NULL,
	`wallet` integer DEFAULT 200 NOT NULL,
	`job` text,
	`candidate` text,
	`paid_at` integer DEFAULT 0 NOT NULL,
	`avatar` text DEFAULT '#76938b' NOT NULL,
	`house_decor` integer DEFAULT 0 NOT NULL,
	`car_level` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `town_settings` ADD `expansion` integer DEFAULT 0 NOT NULL;