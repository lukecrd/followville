CREATE TABLE `home_units` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text NOT NULL,
	`unit` integer NOT NULL,
	`username` text,
	`color` text DEFAULT '#76938b' NOT NULL,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `home_unit_number_unique` ON `home_units` (`building_id`,`unit`);--> statement-breakpoint
CREATE UNIQUE INDEX `home_unit_resident_unique` ON `home_units` (`username`);