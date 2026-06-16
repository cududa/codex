CREATE TABLE `concern_graph_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`concern_slug` text NOT NULL,
	`edge_key` text NOT NULL,
	`edge_kind` text NOT NULL,
	`from_node_id` text NOT NULL,
	`to_node_id` text NOT NULL,
	`source_kind` text NOT NULL,
	`source_ref` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`from_node_id`) REFERENCES `concern_graph_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_node_id`) REFERENCES `concern_graph_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "concern_graph_edges_metadata_json_check" CHECK(json_valid("concern_graph_edges"."metadata_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concern_graph_edges_key_unique` ON `concern_graph_edges` (`edge_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `concern_graph_edges_nodes_kind_unique` ON `concern_graph_edges` (`from_node_id`,`to_node_id`,`edge_kind`);--> statement-breakpoint
CREATE INDEX `concern_graph_edges_concern_idx` ON `concern_graph_edges` (`concern_slug`);--> statement-breakpoint
CREATE INDEX `concern_graph_edges_concern_source_idx` ON `concern_graph_edges` (`concern_slug`,`source_kind`);--> statement-breakpoint
CREATE INDEX `concern_graph_edges_from_idx` ON `concern_graph_edges` (`from_node_id`);--> statement-breakpoint
CREATE INDEX `concern_graph_edges_to_idx` ON `concern_graph_edges` (`to_node_id`);--> statement-breakpoint
CREATE TABLE `concern_graph_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`concern_slug` text NOT NULL,
	`node_key` text NOT NULL,
	`node_kind` text NOT NULL,
	`path` text,
	`symbol` text,
	`marker` text,
	`display_name` text,
	`description` text,
	`source_kind` text NOT NULL,
	`source_ref` text,
	`is_seed` integer DEFAULT false NOT NULL,
	`is_known_missing` integer DEFAULT false NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	CONSTRAINT "concern_graph_nodes_metadata_json_check" CHECK(json_valid("concern_graph_nodes"."metadata_json")),
	CONSTRAINT "concern_graph_nodes_evidence_check" CHECK("concern_graph_nodes"."path" is not null or "concern_graph_nodes"."symbol" is not null or "concern_graph_nodes"."marker" is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concern_graph_nodes_key_unique` ON `concern_graph_nodes` (`node_key`);--> statement-breakpoint
CREATE INDEX `concern_graph_nodes_concern_idx` ON `concern_graph_nodes` (`concern_slug`);--> statement-breakpoint
CREATE INDEX `concern_graph_nodes_concern_source_idx` ON `concern_graph_nodes` (`concern_slug`,`source_kind`);--> statement-breakpoint
CREATE INDEX `concern_graph_nodes_path_idx` ON `concern_graph_nodes` (`path`);--> statement-breakpoint
CREATE TABLE `detector_findings` (
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
	`rationale` text NOT NULL,
	`risk_level` text NOT NULL,
	`confidence` text NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `detector_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_id`) REFERENCES `commits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commit_file_id`) REFERENCES `commit_files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`diff_block_id`) REFERENCES `diff_blocks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`graph_node_id`) REFERENCES `concern_graph_nodes`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "detector_findings_evidence_json_check" CHECK(json_valid("detector_findings"."evidence_json")),
	CONSTRAINT "detector_findings_line_range_check" CHECK("detector_findings"."start_line" is null or ("detector_findings"."start_line" > 0 and ("detector_findings"."end_line" is null or "detector_findings"."end_line" >= "detector_findings"."start_line"))),
	CONSTRAINT "detector_findings_scope_check" CHECK(("detector_findings"."target_type" = 'version' and "detector_findings"."version_id" is not null and "detector_findings"."version_id" = "detector_findings"."target_id" and "detector_findings"."commit_id" is null and "detector_findings"."commit_file_id" is null and "detector_findings"."diff_block_id" is null) or ("detector_findings"."target_type" = 'commit' and "detector_findings"."commit_id" is not null and "detector_findings"."commit_id" = "detector_findings"."target_id" and "detector_findings"."commit_file_id" is null and "detector_findings"."diff_block_id" is null) or ("detector_findings"."target_type" = 'commit_file' and "detector_findings"."commit_file_id" is not null and "detector_findings"."commit_file_id" = "detector_findings"."target_id" and "detector_findings"."diff_block_id" is null) or ("detector_findings"."target_type" = 'diff_block' and "detector_findings"."diff_block_id" is not null and "detector_findings"."diff_block_id" = "detector_findings"."target_id"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `detector_findings_run_key_unique` ON `detector_findings` (`run_id`,`finding_key`);--> statement-breakpoint
CREATE INDEX `detector_findings_run_idx` ON `detector_findings` (`run_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_version_idx` ON `detector_findings` (`version_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_commit_idx` ON `detector_findings` (`commit_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_commit_file_idx` ON `detector_findings` (`commit_file_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_diff_block_idx` ON `detector_findings` (`diff_block_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_graph_node_key_idx` ON `detector_findings` (`graph_node_key`);--> statement-breakpoint
CREATE INDEX `detector_findings_target_idx` ON `detector_findings` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `detector_findings_concern_idx` ON `detector_findings` (`concern_slug`);--> statement-breakpoint
CREATE TABLE `detector_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text,
	`repository_id` text NOT NULL,
	`run_kind` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`concern_map_version` integer NOT NULL,
	`base_sha` text,
	`target_sha` text,
	`source_ref` text,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	`error` text,
	`summary_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "detector_runs_summary_json_check" CHECK(json_valid("detector_runs"."summary_json")),
	CONSTRAINT "detector_runs_completion_check" CHECK(("detector_runs"."status" = 'running' and "detector_runs"."completed_at" is null and "detector_runs"."error" is null) or ("detector_runs"."status" = 'succeeded' and "detector_runs"."completed_at" is not null and "detector_runs"."error" is null) or ("detector_runs"."status" = 'failed' and "detector_runs"."completed_at" is not null and length(trim(coalesce("detector_runs"."error", ''))) > 0))
);
--> statement-breakpoint
CREATE INDEX `detector_runs_version_idx` ON `detector_runs` (`version_id`);--> statement-breakpoint
CREATE INDEX `detector_runs_repository_created_idx` ON `detector_runs` (`repository_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `detector_runs_status_idx` ON `detector_runs` (`status`);