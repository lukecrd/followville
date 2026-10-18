CREATE TABLE `town_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`author_label` text NOT NULL,
	`official` integer DEFAULT 0 NOT NULL,
	`pinned` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `residents` ADD `pay_credit` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `one_townhall` ON `buildings` (`kind`) WHERE "buildings"."kind" = 'townhall';
--> statement-breakpoint
-- Settle already earned income once before switching calendars; wallets are preserved.
UPDATE residents SET wallet=wallet + MIN(8,MAX(0,CAST(((unixepoch('now')*1000)-paid_at)/60000 AS INTEGER))) * CASE job
 WHEN 'barista' THEN 28 WHEN 'gardener' THEN 24 WHEN 'driver' THEN 42 WHEN 'teacher' THEN 36 WHEN 'nurse' THEN 40 WHEN 'librarian' THEN 30 WHEN 'banker' THEN 38 WHEN 'employee' THEN 32 WHEN 'sales-assistant' THEN 30 WHEN 'doctor' THEN 46 WHEN 'firefighter' THEN 40 WHEN 'officer' THEN 38 WHEN 'stadium-staff' THEN 32 WHEN 'zookeeper' THEN 34 WHEN 'ride-operator' THEN 32 WHEN 'cinema-staff' THEN 28 WHEN 'museum-guide' THEN 32 WHEN 'coach' THEN 34 WHEN 'clerk' THEN 26 ELSE 0 END,paid_at=unixepoch('now')*1000 WHERE job IS NOT NULL;
