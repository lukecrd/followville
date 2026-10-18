ALTER TABLE `neighborhood_projects` ADD `kind` text DEFAULT 'garden' NOT NULL;--> statement-breakpoint
ALTER TABLE `neighborhood_projects` ADD `x` integer;--> statement-breakpoint
ALTER TABLE `neighborhood_projects` ADD `y` integer;--> statement-breakpoint
ALTER TABLE `residents` ADD `job_ms` integer DEFAULT 0 NOT NULL;