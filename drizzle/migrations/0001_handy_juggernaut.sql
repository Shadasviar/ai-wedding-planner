CREATE TABLE `guests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`spouse_name` text,
	`children_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
