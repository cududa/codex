PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `classification_metadata`;--> statement-breakpoint
CREATE TABLE `__new_comments` (
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
INSERT INTO `__new_comments`("id", "scope", "version_id", "commit_id", "commit_file_id", "diff_block_id", "anchor_kind", "anchor_diff_block_id", "anchor_commit_file_id", "anchor_side", "start_line", "end_line", "start_column", "end_column", "selected_text", "body", "status", "author_actor_type", "author_actor_id", "author_display_name", "resolved_by_actor_type", "resolved_by_actor_id", "resolved_by_display_name", "created_at", "updated_at", "resolved_at") SELECT "id", "scope", "version_id", "commit_id", "commit_file_id", "diff_block_id", "anchor_kind", "anchor_diff_block_id", "anchor_commit_file_id", "anchor_side", "start_line", "end_line", "start_column", "end_column", "selected_text", "body", "status", "author_actor_type", "author_actor_id", "author_display_name", "resolved_by_actor_type", "resolved_by_actor_id", "resolved_by_display_name", "created_at", "updated_at", "resolved_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
CREATE INDEX `comments_status_idx` ON `comments` (`status`);--> statement-breakpoint
CREATE INDEX `comments_scope_status_idx` ON `comments` (`scope`,`status`);--> statement-breakpoint
CREATE INDEX `comments_scope_target_status_idx` ON `comments` (`scope`,`version_id`,`commit_id`,`commit_file_id`,`diff_block_id`,`status`);--> statement-breakpoint
CREATE INDEX `comments_version_idx` ON `comments` (`version_id`);--> statement-breakpoint
CREATE INDEX `comments_commit_idx` ON `comments` (`commit_id`);--> statement-breakpoint
CREATE INDEX `comments_commit_file_idx` ON `comments` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `comments_diff_block_idx` ON `comments` (`diff_block_id`);--> statement-breakpoint
CREATE TABLE `__new_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`version_id` text,
	`commit_id` text,
	`commit_file_id` text,
	`status` text DEFAULT 'proposed' NOT NULL,
	`outcome` text NOT NULL,
	`proposed_by_actor_type` text NOT NULL,
	`proposed_by_actor_id` text,
	`proposed_by_display_name` text,
	`finalized_by_actor_type` text,
	`finalized_by_actor_id` text,
	`finalized_by_display_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	`finalized_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_decisions`("id", "scope", "version_id", "commit_id", "commit_file_id", "status", "outcome", "proposed_by_actor_type", "proposed_by_actor_id", "proposed_by_display_name", "finalized_by_actor_type", "finalized_by_actor_id", "finalized_by_display_name", "created_at", "updated_at", "finalized_at") SELECT "id", "scope", "version_id", "commit_id", "commit_file_id", "status", "outcome", "proposed_by_actor_type", "proposed_by_actor_id", "proposed_by_display_name", "finalized_by_actor_type", "finalized_by_actor_id", "finalized_by_display_name", "created_at", "updated_at", "finalized_at" FROM `decisions`;--> statement-breakpoint
DROP TABLE `decisions`;--> statement-breakpoint
ALTER TABLE `__new_decisions` RENAME TO `decisions`;--> statement-breakpoint
CREATE INDEX `decisions_scope_status_idx` ON `decisions` (`scope`,`status`);--> statement-breakpoint
CREATE INDEX `decisions_version_idx` ON `decisions` (`version_id`);--> statement-breakpoint
CREATE INDEX `decisions_commit_idx` ON `decisions` (`commit_id`);--> statement-breakpoint
CREATE INDEX `decisions_commit_file_idx` ON `decisions` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `decisions_file_status_finalizer_idx` ON `decisions` (`commit_file_id`,`status`,`finalized_by_actor_type`);--> statement-breakpoint
CREATE INDEX `decisions_outcome_idx` ON `decisions` (`outcome`);--> statement-breakpoint
CREATE TABLE `__new_detector_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`version_id` text,
	`commit_id` text,
	`commit_file_id` text,
	`diff_block_id` text,
	`graph_node_id` text,
	`graph_node_key` text,
	`finding_key` text NOT NULL,
	`concern_slug` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`path` text,
	`side` text,
	`start_line` integer,
	`end_line` integer,
	`symbol` text,
	`marker` text,
	`evidence_kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `detector_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`diff_block_id`) REFERENCES `diff_blocks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`graph_node_id`) REFERENCES `concern_graph_nodes`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "detector_findings_evidence_json_check" CHECK(json_valid("evidence_json")),
	CONSTRAINT "detector_findings_line_range_check" CHECK("start_line" is null or ("start_line" > 0 and ("end_line" is null or "end_line" >= "start_line"))),
	CONSTRAINT "detector_findings_scope_check" CHECK(("target_type" = 'version' and "version_id" is not null and "version_id" = "target_id" and "commit_id" is null and "commit_file_id" is null and "diff_block_id" is null) or ("target_type" = 'commit' and "commit_id" is not null and "commit_id" = "target_id" and "commit_file_id" is null and "diff_block_id" is null) or ("target_type" = 'commit_file' and "commit_file_id" is not null and "commit_file_id" = "target_id" and "diff_block_id" is null) or ("target_type" = 'diff_block' and "diff_block_id" is not null and "diff_block_id" = "target_id"))
);
--> statement-breakpoint
INSERT INTO `__new_detector_findings`("id", "run_id", "version_id", "commit_id", "commit_file_id", "diff_block_id", "graph_node_id", "graph_node_key", "finding_key", "concern_slug", "target_type", "target_id", "path", "side", "start_line", "end_line", "symbol", "marker", "evidence_kind", "title", "summary", "evidence_json", "created_at") SELECT "id", "run_id", "version_id", "commit_id", "commit_file_id", "diff_block_id", "graph_node_id", "graph_node_key", "finding_key", "concern_slug", "target_type", "target_id", "path", "side", "start_line", "end_line", "symbol", "marker", "evidence_kind", "title", "summary", "evidence_json", "created_at" FROM `detector_findings`;--> statement-breakpoint
DROP TABLE `detector_findings`;--> statement-breakpoint
ALTER TABLE `__new_detector_findings` RENAME TO `detector_findings`;--> statement-breakpoint
CREATE UNIQUE INDEX `detector_findings_run_key_unique` ON `detector_findings` (`run_id`,`finding_key`);--> statement-breakpoint
CREATE INDEX `detector_findings_run_idx` ON `detector_findings` (`run_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_version_idx` ON `detector_findings` (`version_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_commit_idx` ON `detector_findings` (`commit_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_commit_file_idx` ON `detector_findings` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_diff_block_idx` ON `detector_findings` (`diff_block_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_graph_node_key_idx` ON `detector_findings` (`graph_node_key`);--> statement-breakpoint
CREATE INDEX `detector_findings_target_idx` ON `detector_findings` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_concern_idx` ON `detector_findings` (`concern_slug`);--> statement-breakpoint
CREATE TABLE `__new_taggings` (
	`id` text PRIMARY KEY NOT NULL,
	`tag_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_by_actor_type` text NOT NULL,
	`created_by_actor_id` text,
	`created_by_display_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `concern_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_taggings`("id", "tag_id", "target_type", "target_id", "kind", "created_by_actor_type", "created_by_actor_id", "created_by_display_name", "created_at") SELECT "id", "tag_id", "target_type", "target_id", "kind", "created_by_actor_type", "created_by_actor_id", "created_by_display_name", "created_at" FROM `taggings`;--> statement-breakpoint
DROP TABLE `taggings`;--> statement-breakpoint
ALTER TABLE `__new_taggings` RENAME TO `taggings`;--> statement-breakpoint
CREATE UNIQUE INDEX `taggings_tag_target_unique` ON `taggings` (`tag_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `taggings_target_idx` ON `taggings` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `taggings_tag_idx` ON `taggings` (`tag_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
