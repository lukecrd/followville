CREATE TABLE `building_tiles` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `building_tile_unique` ON `building_tiles` (`x`,`y`);