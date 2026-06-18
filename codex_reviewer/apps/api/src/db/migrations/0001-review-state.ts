const concernSlugCheck = `concern_area_slug IN (
  'harness-prompts',
  'message-roles',
  'hidden-context',
  'goal-continuation',
  'goal-behavior',
  'context-compaction',
  'tool-affordances',
  'permission-defaults'
)`;

const scopedTargetCheck = `
  (scope_type = 'version' AND version_id IS NOT NULL AND commit_id IS NULL AND file_id IS NULL AND diff_block_id IS NULL) OR
  (scope_type = 'commit' AND version_id IS NULL AND commit_id IS NOT NULL AND file_id IS NULL AND diff_block_id IS NULL) OR
  (scope_type = 'file' AND version_id IS NULL AND commit_id IS NULL AND file_id IS NOT NULL AND diff_block_id IS NULL) OR
  (scope_type = 'diffBlock' AND version_id IS NULL AND commit_id IS NULL AND file_id IS NULL AND diff_block_id IS NOT NULL)
`;

export const reviewStateStatements = [
  `CREATE TABLE local_change_refs (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    sha TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    linked_by_type TEXT NOT NULL CHECK (linked_by_type IN ('human', 'agent', 'system')),
    linked_by_id TEXT NOT NULL,
    linked_by_display_name TEXT,
    linked_at TEXT NOT NULL,
    CHECK ((commit_id IS NOT NULL AND file_id IS NULL) OR (commit_id IS NULL AND file_id IS NOT NULL))
  )`,
  "CREATE INDEX local_change_refs_commit_idx ON local_change_refs(commit_id)",
  "CREATE INDEX local_change_refs_file_idx ON local_change_refs(file_id)",

  `CREATE TABLE agent_commit_reviews (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT NOT NULL REFERENCES review_commits(id) ON DELETE CASCADE,
    reviewed_mark TEXT NOT NULL CHECK (reviewed_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    notes TEXT,
    reviewer_id TEXT NOT NULL,
    reviewer_display_name TEXT,
    reviewed_at TEXT NOT NULL
  )`,
  "CREATE INDEX agent_commit_reviews_commit_idx ON agent_commit_reviews(commit_id)",

  `CREATE TABLE agent_commit_review_concern_areas (
    agent_review_id TEXT NOT NULL REFERENCES agent_commit_reviews(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (agent_review_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX agent_commit_review_concern_areas_position_unique ON agent_commit_review_concern_areas(agent_review_id, position)",

  `CREATE TABLE agent_file_reviews (
    id TEXT PRIMARY KEY NOT NULL,
    file_id TEXT NOT NULL REFERENCES review_files(id) ON DELETE CASCADE,
    reviewed_mark TEXT NOT NULL CHECK (reviewed_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    notes TEXT,
    reviewer_id TEXT NOT NULL,
    reviewer_display_name TEXT,
    reviewed_at TEXT NOT NULL
  )`,
  "CREATE INDEX agent_file_reviews_file_idx ON agent_file_reviews(file_id)",

  `CREATE TABLE human_commit_approvals (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT NOT NULL REFERENCES review_commits(id) ON DELETE CASCADE,
    approved_mark TEXT NOT NULL CHECK (approved_mark IN ('PASS', 'DONE')),
    notes TEXT,
    approved_by_id TEXT NOT NULL,
    approved_by_display_name TEXT,
    approved_at TEXT NOT NULL
  )`,
  "CREATE INDEX human_commit_approvals_commit_idx ON human_commit_approvals(commit_id)",
  "CREATE UNIQUE INDEX human_commit_approvals_commit_unique ON human_commit_approvals(commit_id)",

  `CREATE TABLE human_commit_approval_concern_areas (
    human_approval_id TEXT NOT NULL REFERENCES human_commit_approvals(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (human_approval_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX human_commit_approval_concern_areas_position_unique ON human_commit_approval_concern_areas(human_approval_id, position)",

  `CREATE TABLE human_file_approvals (
    id TEXT PRIMARY KEY NOT NULL,
    file_id TEXT NOT NULL REFERENCES review_files(id) ON DELETE CASCADE,
    approved_mark TEXT NOT NULL CHECK (approved_mark IN ('PASS', 'DONE')),
    notes TEXT,
    approved_by_id TEXT NOT NULL,
    approved_by_display_name TEXT,
    approved_at TEXT NOT NULL
  )`,
  "CREATE INDEX human_file_approvals_file_idx ON human_file_approvals(file_id)",
  "CREATE UNIQUE INDEX human_file_approvals_file_unique ON human_file_approvals(file_id)",

  `CREATE TABLE review_events (
    id TEXT PRIMARY KEY NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    version_id TEXT REFERENCES review_versions(id) ON DELETE CASCADE,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (
      kind IN (
        'reviewMarkChanged',
        'concernAreasChanged',
        'agentReviewRecorded',
        'humanApprovalRecorded',
        'humanApprovalRevoked',
        'localChangeLinked',
        'commentResolved',
        'planUpdated'
      )
    ),
    actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
    actor_id TEXT NOT NULL,
    actor_display_name TEXT,
    summary TEXT NOT NULL,
    previous_review_mark TEXT CHECK (previous_review_mark IS NULL OR previous_review_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    new_review_mark TEXT CHECK (new_review_mark IS NULL OR new_review_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    agent_review_id TEXT,
    human_approval_id TEXT,
    approved_mark TEXT CHECK (approved_mark IS NULL OR approved_mark IN ('PASS', 'DONE')),
    local_change_ref_id TEXT REFERENCES local_change_refs(id) ON DELETE CASCADE,
    local_change_sha TEXT,
    comment_id TEXT,
    thread_id TEXT,
    review_plan_id TEXT,
    created_at TEXT NOT NULL,
    CHECK (${scopedTargetCheck}),
    CHECK (
      (kind = 'reviewMarkChanged' AND new_review_mark IS NOT NULL AND agent_review_id IS NULL AND human_approval_id IS NULL AND local_change_ref_id IS NULL AND comment_id IS NULL AND thread_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'concernAreasChanged' AND previous_review_mark IS NULL AND new_review_mark IS NULL AND agent_review_id IS NULL AND human_approval_id IS NULL AND local_change_ref_id IS NULL AND comment_id IS NULL AND thread_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'agentReviewRecorded' AND agent_review_id IS NOT NULL AND previous_review_mark IS NULL AND new_review_mark IS NULL AND human_approval_id IS NULL AND local_change_ref_id IS NULL AND comment_id IS NULL AND thread_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'humanApprovalRecorded' AND human_approval_id IS NOT NULL AND approved_mark IS NOT NULL AND previous_review_mark IS NULL AND new_review_mark IS NULL AND agent_review_id IS NULL AND local_change_ref_id IS NULL AND comment_id IS NULL AND thread_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'humanApprovalRevoked' AND human_approval_id IS NOT NULL AND previous_review_mark IS NULL AND new_review_mark IS NULL AND approved_mark IS NULL AND agent_review_id IS NULL AND local_change_ref_id IS NULL AND comment_id IS NULL AND thread_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'localChangeLinked' AND local_change_ref_id IS NOT NULL AND local_change_sha IS NOT NULL AND previous_review_mark IS NULL AND new_review_mark IS NULL AND agent_review_id IS NULL AND human_approval_id IS NULL AND comment_id IS NULL AND thread_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'commentResolved' AND comment_id IS NOT NULL AND thread_id IS NOT NULL AND previous_review_mark IS NULL AND new_review_mark IS NULL AND agent_review_id IS NULL AND human_approval_id IS NULL AND approved_mark IS NULL AND local_change_ref_id IS NULL AND review_plan_id IS NULL) OR
      (kind = 'planUpdated' AND review_plan_id IS NOT NULL AND previous_review_mark IS NULL AND new_review_mark IS NULL AND agent_review_id IS NULL AND human_approval_id IS NULL AND approved_mark IS NULL AND local_change_ref_id IS NULL AND comment_id IS NULL AND thread_id IS NULL)
    )
  )`,
  "CREATE INDEX review_events_version_idx ON review_events(version_id)",
  "CREATE INDEX review_events_commit_idx ON review_events(commit_id)",
  "CREATE INDEX review_events_file_idx ON review_events(file_id)",
  "CREATE INDEX review_events_diff_block_idx ON review_events(diff_block_id)",

  `CREATE TABLE review_event_previous_concern_areas (
    review_event_id TEXT NOT NULL REFERENCES review_events(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (review_event_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX review_event_previous_concern_areas_position_unique ON review_event_previous_concern_areas(review_event_id, position)",

  `CREATE TABLE review_event_new_concern_areas (
    review_event_id TEXT NOT NULL REFERENCES review_events(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (review_event_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX review_event_new_concern_areas_position_unique ON review_event_new_concern_areas(review_event_id, position)",
];
