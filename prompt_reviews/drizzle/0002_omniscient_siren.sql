CREATE TABLE `classification_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`summary` text,
	`risk_level` text,
	`confidence` text,
	`updated_by_actor_type` text NOT NULL,
	`updated_by_actor_id` text,
	`updated_by_display_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classification_metadata_target_unique` ON `classification_metadata` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `classification_metadata_target_idx` ON `classification_metadata` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `plan_diff_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`diff_block_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`diff_block_id`) REFERENCES `diff_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_diff_blocks_plan_diff_block_unique` ON `plan_diff_blocks` (`plan_id`,`diff_block_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_commit_files` (
	`id` text PRIMARY KEY NOT NULL,
	`commit_id` text NOT NULL,
	`old_path` text,
	`new_path` text,
	`change_type` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`status_override` text,
	`status_override_reason` text,
	`status_override_actor_type` text,
	`status_override_actor_id` text,
	`status_override_display_name` text,
	`status_override_at` integer,
	`additions` integer DEFAULT 0 NOT NULL,
	`deletions` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "commit_files_path_present_check" CHECK("__new_commit_files"."old_path" is not null or "__new_commit_files"."new_path" is not null),
	CONSTRAINT "commit_files_status_override_reason_check" CHECK(("__new_commit_files"."status_override" is null and "__new_commit_files"."status_override_reason" is null and "__new_commit_files"."status_override_actor_type" is null and "__new_commit_files"."status_override_at" is null) or ("__new_commit_files"."status_override" is not null and length(trim(coalesce("__new_commit_files"."status_override_reason", ''))) > 0 and "__new_commit_files"."status_override_actor_type" is not null and "__new_commit_files"."status_override_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_commit_files`("id", "commit_id", "old_path", "new_path", "change_type", "review_status", "status_override", "status_override_reason", "status_override_actor_type", "status_override_actor_id", "status_override_display_name", "status_override_at", "additions", "deletions", "created_at", "updated_at") SELECT "id", "commit_id", "old_path", "new_path", "change_type", "review_status", null, null, null, null, null, null, "additions", "deletions", "created_at", "updated_at" FROM `commit_files`;--> statement-breakpoint
DROP TABLE `commit_files`;--> statement-breakpoint
ALTER TABLE `__new_commit_files` RENAME TO `commit_files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `commit_files_commit_paths_unique` ON `commit_files` (`commit_id`,`old_path`,`new_path`) WHERE "commit_files"."old_path" is not null and "commit_files"."new_path" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `commit_files_commit_added_new_unique` ON `commit_files` (`commit_id`,`new_path`) WHERE "commit_files"."old_path" is null and "commit_files"."new_path" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `commit_files_commit_deleted_old_unique` ON `commit_files` (`commit_id`,`old_path`) WHERE "commit_files"."old_path" is not null and "commit_files"."new_path" is null;--> statement-breakpoint
CREATE INDEX `commit_files_commit_status_idx` ON `commit_files` (`commit_id`,`review_status`);--> statement-breakpoint
CREATE INDEX `commit_files_new_path_idx` ON `commit_files` (`new_path`);--> statement-breakpoint
CREATE INDEX `commit_files_old_path_idx` ON `commit_files` (`old_path`);--> statement-breakpoint
CREATE TABLE `__new_commits` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`sha` text NOT NULL,
	`parent_sha` text,
	`ordinal` integer NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`author_name` text,
	`author_email` text,
	`committed_at` integer,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`status_override` text,
	`status_override_reason` text,
	`status_override_actor_type` text,
	`status_override_actor_id` text,
	`status_override_display_name` text,
	`status_override_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "commits_status_override_reason_check" CHECK(("__new_commits"."status_override" is null and "__new_commits"."status_override_reason" is null and "__new_commits"."status_override_actor_type" is null and "__new_commits"."status_override_at" is null) or ("__new_commits"."status_override" is not null and length(trim(coalesce("__new_commits"."status_override_reason", ''))) > 0 and "__new_commits"."status_override_actor_type" is not null and "__new_commits"."status_override_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_commits`("id", "version_id", "sha", "parent_sha", "ordinal", "title", "message", "author_name", "author_email", "committed_at", "review_status", "status_override", "status_override_reason", "status_override_actor_type", "status_override_actor_id", "status_override_display_name", "status_override_at", "created_at", "updated_at") SELECT "id", "version_id", "sha", "parent_sha", "ordinal", "title", "message", "author_name", "author_email", "committed_at", "review_status", null, null, null, null, null, null, "created_at", "updated_at" FROM `commits`;--> statement-breakpoint
DROP TABLE `commits`;--> statement-breakpoint
ALTER TABLE `__new_commits` RENAME TO `commits`;--> statement-breakpoint
CREATE UNIQUE INDEX `commits_version_sha_unique` ON `commits` (`version_id`,`sha`);--> statement-breakpoint
CREATE UNIQUE INDEX `commits_version_ordinal_unique` ON `commits` (`version_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `commits_version_status_idx` ON `commits` (`version_id`,`review_status`);--> statement-breakpoint
CREATE INDEX `commits_sha_idx` ON `commits` (`sha`);
