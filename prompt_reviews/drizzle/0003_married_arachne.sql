CREATE INDEX `comments_scope_target_status_idx` ON `comments` (`scope`,`version_id`,`commit_id`,`commit_file_id`,`diff_block_id`,`status`);--> statement-breakpoint
CREATE INDEX `commit_files_commit_created_idx` ON `commit_files` (`commit_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `decisions_file_status_finalizer_idx` ON `decisions` (`commit_file_id`,`status`,`finalized_by_actor_type`);--> statement-breakpoint
CREATE INDEX `plan_items_status_plan_idx` ON `plan_items` (`status`,`plan_id`);