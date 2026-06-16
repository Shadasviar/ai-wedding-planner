CREATE TABLE `catering` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cost_per_plate` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catering_menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`custom_type` text,
	`is_vege` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
