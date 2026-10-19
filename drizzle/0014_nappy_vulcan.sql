CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`first_user` text NOT NULL,
	`second_user` text NOT NULL,
	`requester` text NOT NULL,
	`created_at` integer NOT NULL,
	`accepted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_pair` ON `friendships` (`first_user`,`second_user`);--> statement-breakpoint
CREATE TABLE `party_attendees` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text,
	`username` text NOT NULL,
	`joined_at` integer NOT NULL,
	`departure_at` integer NOT NULL,
	`from_x` integer NOT NULL,
	`from_y` integer NOT NULL,
	FOREIGN KEY (`party_id`) REFERENCES `town_parties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `party_guest` ON `party_attendees` (`party_id`,`username`);--> statement-breakpoint
CREATE TABLE `resident_shops` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`color` text NOT NULL,
	`products` text NOT NULL,
	`created_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `active_shop_building` ON `resident_shops` (`building_id`) WHERE "resident_shops"."closed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `active_shop_owner` ON `resident_shops` (`owner`) WHERE "resident_shops"."closed_at" IS NULL;--> statement-breakpoint
CREATE TABLE `shop_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text,
	`buyer` text NOT NULL,
	`seller` text NOT NULL,
	`product` text NOT NULL,
	`price` integer NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `resident_shops`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_shop_purchase` ON `shop_orders` (`shop_id`,`buyer`,`product`,`day`);--> statement-breakpoint
CREATE TABLE `town_parties` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text,
	`host` text NOT NULL,
	`title` text NOT NULL,
	`theme` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`fee` integer NOT NULL,
	`created_at` integer NOT NULL,
	`cancelled_at` integer,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE set null
);
