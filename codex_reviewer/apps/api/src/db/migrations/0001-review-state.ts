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

  `CREATE TABLE agent_reviews (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    reviewed_mark TEXT NOT NULL CHECK (reviewed_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    notes TEXT,
    reviewer_id TEXT NOT NULL,
    reviewer_display_name TEXT,
    reviewed_at TEXT NOT NULL,
    CHECK ((commit_id IS NOT NULL AND file_id IS NULL) OR (commit_id IS NULL AND file_id IS NOT NULL))
  )`,
  "CREATE INDEX agent_reviews_commit_idx ON agent_reviews(commit_id)",
  "CREATE INDEX agent_reviews_file_idx ON agent_reviews(file_id)",

  `CREATE TABLE agent_review_concern_areas (
    agent_review_id TEXT NOT NULL REFERENCES agent_reviews(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (agent_review_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX agent_review_concern_areas_position_unique ON agent_review_concern_areas(agent_review_id, position)",

  `CREATE TABLE human_approvals (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    approved_mark TEXT NOT NULL CHECK (approved_mark IN ('PASS', 'DONE')),
    notes TEXT,
    approved_by_id TEXT NOT NULL,
    approved_by_display_name TEXT,
    approved_at TEXT NOT NULL,
    CHECK ((commit_id IS NOT NULL AND file_id IS NULL) OR (commit_id IS NULL AND file_id IS NOT NULL))
  )`,
  "CREATE INDEX human_approvals_commit_idx ON human_approvals(commit_id)",
  "CREATE INDEX human_approvals_file_idx ON human_approvals(file_id)",
  "CREATE UNIQUE INDEX human_approvals_commit_unique ON human_approvals(commit_id) WHERE commit_id IS NOT NULL",
  "CREATE UNIQUE INDEX human_approvals_file_unique ON human_approvals(file_id) WHERE file_id IS NOT NULL",

  `CREATE TABLE human_approval_concern_areas (
    human_approval_id TEXT NOT NULL REFERENCES human_approvals(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (human_approval_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX human_approval_concern_areas_position_unique ON human_approval_concern_areas(human_approval_id, position)",

  `CREATE TABLE review_events (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
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
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    CHECK ((commit_id IS NOT NULL AND file_id IS NULL) OR (commit_id IS NULL AND file_id IS NOT NULL))
  )`,
  "CREATE INDEX review_events_commit_idx ON review_events(commit_id)",
  "CREATE INDEX review_events_file_idx ON review_events(file_id)",
];
