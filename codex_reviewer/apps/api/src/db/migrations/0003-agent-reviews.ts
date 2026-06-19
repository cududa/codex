export const agentReviewStatements = [
  "ALTER TABLE review_events RENAME TO review_events_legacy",
  `CREATE TABLE review_events (
    id TEXT PRIMARY KEY NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    scope_id TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
    actor_id TEXT NOT NULL,
    actor_display_name TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('review_mark_changed', 'concern_areas_changed', 'agent_review_recorded')),
    summary TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `INSERT INTO review_events
    (id, scope_type, scope_id, actor_type, actor_id, actor_display_name, kind, summary, payload_json, created_at)
    SELECT id, scope_type, scope_id, actor_type, actor_id, actor_display_name, kind, summary, payload_json, created_at
    FROM review_events_legacy`,
  "DROP TABLE review_events_legacy",
  "CREATE INDEX review_events_scope_idx ON review_events(scope_type, scope_id)",
  "CREATE INDEX review_events_created_at_idx ON review_events(created_at)",

  `CREATE TABLE agent_reviews (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    reviewed_mark TEXT NOT NULL CHECK (reviewed_mark IN ('PASS', 'FLAG', 'MODIFY')),
    reviewer_actor_type TEXT NOT NULL CHECK (reviewer_actor_type = 'agent'),
    reviewer_actor_id TEXT NOT NULL,
    reviewer_actor_display_name TEXT,
    notes_markdown TEXT,
    created_at TEXT NOT NULL,
    CHECK ((commit_id IS NULL) <> (file_id IS NULL))
  )`,
  "CREATE INDEX agent_reviews_commit_idx ON agent_reviews(commit_id)",
  "CREATE INDEX agent_reviews_file_idx ON agent_reviews(file_id)",
  "CREATE INDEX agent_reviews_created_at_idx ON agent_reviews(created_at)",
  "CREATE UNIQUE INDEX agent_reviews_id_commit_unique ON agent_reviews(id, commit_id)",

  `CREATE TABLE agent_review_concern_areas (
    agent_review_id TEXT NOT NULL,
    commit_id TEXT NOT NULL REFERENCES review_commits(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (
      concern_area_slug IN (
        'harness-prompts',
        'message-roles',
        'hidden-context',
        'goal-continuation',
        'goal-behavior',
        'context-compaction',
        'tool-affordances',
        'permission-defaults'
      )
    ),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (agent_review_id, concern_area_slug),
    FOREIGN KEY (agent_review_id, commit_id)
      REFERENCES agent_reviews(id, commit_id)
      ON DELETE CASCADE
  )`,
  "CREATE UNIQUE INDEX agent_review_concern_areas_position_unique ON agent_review_concern_areas(agent_review_id, position)",
];
