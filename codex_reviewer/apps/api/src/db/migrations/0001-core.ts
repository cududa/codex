export const coreStatements = [
  `CREATE TABLE review_versions (
    id TEXT PRIMARY KEY NOT NULL,
    label TEXT NOT NULL,
    repository_id TEXT NOT NULL,
    base_ref TEXT,
    target_ref TEXT,
    base_sha TEXT,
    target_sha TEXT,
    state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'readyForApproval', 'finalized')),
    created_at TEXT NOT NULL,
    updated_at TEXT
  )`,

  `CREATE TABLE review_commits (
    id TEXT PRIMARY KEY NOT NULL,
    version_id TEXT NOT NULL REFERENCES review_versions(id) ON DELETE CASCADE,
    sha TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    author_name TEXT,
    committed_at TEXT,
    review_mark TEXT NOT NULL DEFAULT 'FLAG' CHECK (review_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    created_at TEXT NOT NULL,
    updated_at TEXT
  )`,
  "CREATE INDEX review_commits_version_idx ON review_commits(version_id)",
  "CREATE UNIQUE INDEX review_commits_version_sha_unique ON review_commits(version_id, sha)",

  `CREATE TABLE review_files (
    id TEXT PRIMARY KEY NOT NULL,
    commit_id TEXT NOT NULL REFERENCES review_commits(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    old_path TEXT,
    change_kind TEXT NOT NULL CHECK (change_kind IN ('added', 'modified', 'deleted', 'renamed', 'copied', 'modeChanged')),
    review_mark TEXT CHECK (review_mark IS NULL OR review_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    created_at TEXT NOT NULL,
    updated_at TEXT
  )`,
  "CREATE INDEX review_files_commit_idx ON review_files(commit_id)",

  `CREATE TABLE diff_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    file_id TEXT NOT NULL REFERENCES review_files(id) ON DELETE CASCADE,
    heading TEXT,
    old_start_line INTEGER,
    old_end_line INTEGER,
    new_start_line INTEGER,
    new_end_line INTEGER,
    patch TEXT NOT NULL,
    CHECK (old_start_line IS NULL OR old_end_line IS NULL OR old_start_line <= old_end_line),
    CHECK (new_start_line IS NULL OR new_end_line IS NULL OR new_start_line <= new_end_line)
  )`,
  "CREATE INDEX diff_blocks_file_idx ON diff_blocks(file_id)",

  `CREATE TABLE commit_concern_areas (
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
    PRIMARY KEY (commit_id, concern_area_slug)
  )`,
  "CREATE UNIQUE INDEX commit_concern_areas_position_unique ON commit_concern_areas(commit_id, position)",
];
