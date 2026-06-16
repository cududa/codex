CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`version_id` text,
	`commit_id` text,
	`commit_file_id` text,
	`diff_block_id` text,
	`anchor_kind` text DEFAULT 'scope' NOT NULL,
	`anchor_diff_block_id` text,
	`anchor_commit_file_id` text,
	`anchor_side` text,
	`start_line` integer,
	`end_line` integer,
	`start_column` integer,
	`end_column` integer,
	`selected_text` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`author_actor_type` text NOT NULL,
	`author_actor_id` text,
	`author_display_name` text,
	`resolution` text,
	`resolved_by_actor_type` text,
	`resolved_by_actor_id` text,
	`resolved_by_display_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	`resolved_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`diff_block_id`) REFERENCES `diff_blocks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`anchor_diff_block_id`) REFERENCES `diff_blocks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`anchor_commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `comments_status_idx` ON `comments` (`status`);--> statement-breakpoint
CREATE INDEX `comments_scope_status_idx` ON `comments` (`scope`,`status`);--> statement-breakpoint
CREATE INDEX `comments_version_idx` ON `comments` (`version_id`);--> statement-breakpoint
CREATE INDEX `comments_commit_idx` ON `comments` (`commit_id`);--> statement-breakpoint
CREATE INDEX `comments_commit_file_idx` ON `comments` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `comments_diff_block_idx` ON `comments` (`diff_block_id`);--> statement-breakpoint
CREATE TABLE `commit_files` (
	`id` text PRIMARY KEY NOT NULL,
	`commit_id` text NOT NULL,
	`old_path` text,
	`new_path` text,
	`change_type` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`additions` integer DEFAULT 0 NOT NULL,
	`deletions` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "commit_files_path_present_check" CHECK("commit_files"."old_path" is not null or "commit_files"."new_path" is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commit_files_commit_paths_unique` ON `commit_files` (`commit_id`,`old_path`,`new_path`) WHERE "commit_files"."old_path" is not null and "commit_files"."new_path" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `commit_files_commit_added_new_unique` ON `commit_files` (`commit_id`,`new_path`) WHERE "commit_files"."old_path" is null and "commit_files"."new_path" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `commit_files_commit_deleted_old_unique` ON `commit_files` (`commit_id`,`old_path`) WHERE "commit_files"."old_path" is not null and "commit_files"."new_path" is null;--> statement-breakpoint
CREATE INDEX `commit_files_commit_status_idx` ON `commit_files` (`commit_id`,`review_status`);--> statement-breakpoint
CREATE INDEX `commit_files_new_path_idx` ON `commit_files` (`new_path`);--> statement-breakpoint
CREATE INDEX `commit_files_old_path_idx` ON `commit_files` (`old_path`);--> statement-breakpoint
CREATE TABLE `commits` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`sha` text NOT NULL,
	`ordinal` integer NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`author_name` text,
	`author_email` text,
	`committed_at` integer,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commits_version_sha_unique` ON `commits` (`version_id`,`sha`);--> statement-breakpoint
CREATE UNIQUE INDEX `commits_version_ordinal_unique` ON `commits` (`version_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `commits_version_status_idx` ON `commits` (`version_id`,`review_status`);--> statement-breakpoint
CREATE INDEX `commits_sha_idx` ON `commits` (`sha`);--> statement-breakpoint
CREATE TABLE `concern_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`parent_id` text,
	`description` text NOT NULL,
	`examples_json` text DEFAULT '[]' NOT NULL,
	`pitfalls_json` text DEFAULT '[]' NOT NULL,
	`sort_order` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `concern_tags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concern_tags_slug_unique` ON `concern_tags` (`slug`);--> statement-breakpoint
CREATE INDEX `concern_tags_parent_idx` ON `concern_tags` (`parent_id`);--> statement-breakpoint
CREATE INDEX `concern_tags_active_sort_idx` ON `concern_tags` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `decision_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`comment_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decision_comments_decision_comment_unique` ON `decision_comments` (`decision_id`,`comment_id`);--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`version_id` text,
	`commit_id` text,
	`commit_file_id` text,
	`status` text DEFAULT 'proposed' NOT NULL,
	`outcome` text NOT NULL,
	`rationale` text NOT NULL,
	`proposed_by_actor_type` text NOT NULL,
	`proposed_by_actor_id` text,
	`proposed_by_display_name` text,
	`finalized_by_actor_type` text,
	`finalized_by_actor_id` text,
	`finalized_by_display_name` text,
	`risk_level` text,
	`confidence` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	`finalized_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `decisions_scope_status_idx` ON `decisions` (`scope`,`status`);--> statement-breakpoint
CREATE INDEX `decisions_version_idx` ON `decisions` (`version_id`);--> statement-breakpoint
CREATE INDEX `decisions_commit_idx` ON `decisions` (`commit_id`);--> statement-breakpoint
CREATE INDEX `decisions_commit_file_idx` ON `decisions` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `decisions_outcome_idx` ON `decisions` (`outcome`);--> statement-breakpoint
CREATE TABLE `diff_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`commit_file_id` text NOT NULL,
	`block_key` text NOT NULL,
	`ordinal` integer NOT NULL,
	`content_hash` text NOT NULL,
	`heading` text,
	`old_start_line` integer,
	`old_end_line` integer,
	`new_start_line` integer,
	`new_end_line` integer,
	`patch` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diff_blocks_file_key_unique` ON `diff_blocks` (`commit_file_id`,`block_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `diff_blocks_file_ordinal_unique` ON `diff_blocks` (`commit_file_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `diff_blocks_file_hash_idx` ON `diff_blocks` (`commit_file_id`,`content_hash`);--> statement-breakpoint
CREATE TABLE `plan_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`comment_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_comments_plan_comment_unique` ON `plan_comments` (`plan_id`,`comment_id`);--> statement-breakpoint
CREATE TABLE `plan_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`decision_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_decisions_plan_decision_unique` ON `plan_decisions` (`plan_id`,`decision_id`);--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`blocking_reason` text,
	`commit_file_id` text,
	`decision_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_items_plan_ordinal_unique` ON `plan_items` (`plan_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `plan_items_plan_status_idx` ON `plan_items` (`plan_id`,`status`);--> statement-breakpoint
CREATE INDEX `plan_items_commit_file_idx` ON `plan_items` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `plan_items_decision_idx` ON `plan_items` (`decision_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`version_id` text,
	`commit_id` text,
	`commit_file_id` text,
	`title` text NOT NULL,
	`summary` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`proposed_by_actor_type` text NOT NULL,
	`proposed_by_actor_id` text,
	`proposed_by_display_name` text,
	`completed_by_actor_type` text,
	`completed_by_actor_id` text,
	`completed_by_display_name` text,
	`completion_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plans_version_status_idx` ON `plans` (`version_id`,`status`);--> statement-breakpoint
CREATE INDEX `plans_commit_idx` ON `plans` (`commit_id`);--> statement-breakpoint
CREATE TABLE `taggings` (
	`id` text PRIMARY KEY NOT NULL,
	`tag_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`kind` text NOT NULL,
	`rationale` text,
	`created_by_actor_type` text NOT NULL,
	`created_by_actor_id` text,
	`created_by_display_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `concern_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `taggings_tag_target_unique` ON `taggings` (`tag_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `taggings_target_idx` ON `taggings` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `taggings_tag_idx` ON `taggings` (`tag_id`);--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`repository_id` text NOT NULL,
	`label` text NOT NULL,
	`base_sha` text NOT NULL,
	`target_sha` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	`closed_at` integer,
	`closed_by_actor_type` text,
	`closed_by_actor_id` text,
	`closed_by_display_name` text,
	`closure_summary` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `versions_label_unique` ON `versions` (`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `versions_base_target_unique` ON `versions` (`base_sha`,`target_sha`);--> statement-breakpoint
CREATE INDEX `versions_status_idx` ON `versions` (`status`);--> statement-breakpoint
CREATE INDEX `versions_target_sha_idx` ON `versions` (`target_sha`);