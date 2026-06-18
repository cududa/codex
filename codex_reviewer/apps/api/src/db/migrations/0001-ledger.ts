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
  `CREATE TABLE review_ledgers (
    id TEXT PRIMARY KEY NOT NULL,
    version_id TEXT NOT NULL REFERENCES review_versions(id) ON DELETE CASCADE,
    generated_by_id TEXT NOT NULL,
    generated_by_display_name TEXT,
    generated_at TEXT NOT NULL,
    summary TEXT
  )`,
  "CREATE UNIQUE INDEX review_ledgers_version_unique ON review_ledgers(version_id)",

  `CREATE TABLE review_ledger_entries (
    id TEXT PRIMARY KEY NOT NULL,
    ledger_id TEXT NOT NULL REFERENCES review_ledgers(id) ON DELETE CASCADE,
    commit_id TEXT NOT NULL REFERENCES review_commits(id) ON DELETE CASCADE,
    upstream_sha TEXT NOT NULL,
    final_mark TEXT NOT NULL CHECK (final_mark IN ('PASS', 'DONE')),
    required_local_change_ref_id TEXT REFERENCES local_change_refs(id) ON DELETE RESTRICT,
    approved_by_id TEXT NOT NULL,
    approved_by_display_name TEXT,
    approved_at TEXT NOT NULL,
    CHECK (
      (final_mark = 'PASS' AND required_local_change_ref_id IS NULL) OR
      (final_mark = 'DONE' AND required_local_change_ref_id IS NOT NULL)
    )
  )`,
  "CREATE INDEX review_ledger_entries_ledger_idx ON review_ledger_entries(ledger_id)",
  "CREATE UNIQUE INDEX review_ledger_entries_commit_unique ON review_ledger_entries(ledger_id, commit_id)",

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

  `CREATE TRIGGER review_ledger_entries_done_ref_matches_commit_insert
    AFTER INSERT ON review_ledger_entries
    WHEN NEW.final_mark = 'DONE'
      AND NOT EXISTS (
        SELECT 1 FROM local_change_refs
        WHERE id = NEW.required_local_change_ref_id AND commit_id = NEW.commit_id
      )
    BEGIN
      SELECT RAISE(ABORT, 'DONE ledger entries require local change evidence for the same commit');
    END`,
  `CREATE TRIGGER review_ledger_entries_done_ref_matches_commit_update
    AFTER UPDATE OF final_mark, required_local_change_ref_id, commit_id ON review_ledger_entries
    WHEN NEW.final_mark = 'DONE'
      AND NOT EXISTS (
        SELECT 1 FROM local_change_refs
        WHERE id = NEW.required_local_change_ref_id AND commit_id = NEW.commit_id
      )
    BEGIN
      SELECT RAISE(ABORT, 'DONE ledger entries require local change evidence for the same commit');
    END`,
];
