export const reviewEventStatements = [
  `CREATE TABLE review_events (
    id TEXT PRIMARY KEY NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    scope_id TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
    actor_id TEXT NOT NULL,
    actor_display_name TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('review_mark_changed', 'concern_areas_changed')),
    summary TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX review_events_scope_idx ON review_events(scope_type, scope_id)",
  "CREATE INDEX review_events_created_at_idx ON review_events(created_at)",
];
