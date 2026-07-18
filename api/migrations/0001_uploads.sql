CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text,
	`size` integer NOT NULL,
	`sha256` text,
	`course` text,
	`category` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `uploads_user_idx` ON `uploads` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `uploads_status_idx` ON `uploads` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `uploads_sha_idx` ON `uploads` (`sha256`);