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

export const ledgerStatements = [
  `CREATE TABLE version_finalizations (
    id TEXT PRIMARY KEY NOT NULL,
    version_id TEXT NOT NULL REFERENCES review_versions(id) ON DELETE CASCADE,
    finalized_by_id TEXT NOT NULL,
    finalized_by_display_name TEXT,
    finalized_at TEXT NOT NULL,
    summary TEXT
  )`,
  "CREATE UNIQUE INDEX version_finalizations_version_unique ON version_finalizations(version_id)",

  `CREATE TABLE review_ledger_entries (
    id TEXT PRIMARY KEY NOT NULL,
    finalization_id TEXT NOT NULL REFERENCES version_finalizations(id) ON DELETE CASCADE,
    commit_id TEXT NOT NULL REFERENCES review_commits(id) ON DELETE CASCADE,
    upstream_sha TEXT NOT NULL,
    final_mark TEXT NOT NULL CHECK (final_mark IN ('PASS', 'DONE')),
    approved_by_id TEXT NOT NULL,
    approved_by_display_name TEXT,
    approved_at TEXT NOT NULL
  )`,
  "CREATE INDEX review_ledger_entries_finalization_idx ON review_ledger_entries(finalization_id)",
  "CREATE UNIQUE INDEX review_ledger_entries_commit_unique ON review_ledger_entries(finalization_id, commit_id)",

  `CREATE TABLE review_ledger_entry_concern_areas (
    ledger_entry_id TEXT NOT NULL REFERENCES review_ledger_entries(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 3),
    PRIMARY KEY (ledger_entry_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX review_ledger_entry_concern_areas_position_unique ON review_ledger_entry_concern_areas(ledger_entry_id, position)",

  `CREATE TABLE review_ledger_entry_local_change_refs (
    ledger_entry_id TEXT NOT NULL REFERENCES review_ledger_entries(id) ON DELETE CASCADE,
    local_change_ref_id TEXT NOT NULL REFERENCES local_change_refs(id) ON DELETE CASCADE,
    PRIMARY KEY (ledger_entry_id, local_change_ref_id)
  )`,
];
