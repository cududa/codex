const scopedTargetCheck = `
  (scope_type = 'version' AND version_id IS NOT NULL AND commit_id IS NULL AND file_id IS NULL AND diff_block_id IS NULL) OR
  (scope_type = 'commit' AND version_id IS NULL AND commit_id IS NOT NULL AND file_id IS NULL AND diff_block_id IS NULL) OR
  (scope_type = 'file' AND version_id IS NULL AND commit_id IS NULL AND file_id IS NOT NULL AND diff_block_id IS NULL) OR
  (scope_type = 'diffBlock' AND version_id IS NULL AND commit_id IS NULL AND file_id IS NULL AND diff_block_id IS NOT NULL)
`;

export const collaborationStatements = [
  `CREATE TABLE threaded_comments (
    id TEXT PRIMARY KEY NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    version_id TEXT REFERENCES review_versions(id) ON DELETE CASCADE,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    anchor_kind TEXT NOT NULL CHECK (anchor_kind IN ('scope', 'diffBlock', 'range')),
    anchor_diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    anchor_file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    anchor_side TEXT CHECK (anchor_side IS NULL OR anchor_side IN ('old', 'new')),
    anchor_start_line INTEGER,
    anchor_end_line INTEGER,
    selected_text TEXT,
    thread_id TEXT NOT NULL,
    parent_comment_id TEXT REFERENCES threaded_comments(id) ON DELETE CASCADE,
    body_markdown TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'resolved')),
    author_type TEXT NOT NULL CHECK (author_type IN ('human', 'agent', 'system')),
    author_id TEXT NOT NULL,
    author_display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    resolved_by_type TEXT CHECK (resolved_by_type IS NULL OR resolved_by_type IN ('human', 'agent', 'system')),
    resolved_by_id TEXT,
    resolved_by_display_name TEXT,
    resolved_at TEXT,
    CHECK (${scopedTargetCheck}),
    CHECK (
      (anchor_kind = 'scope' AND anchor_diff_block_id IS NULL AND anchor_file_id IS NULL AND anchor_side IS NULL AND anchor_start_line IS NULL AND anchor_end_line IS NULL) OR
      (anchor_kind = 'diffBlock' AND anchor_diff_block_id IS NOT NULL AND anchor_file_id IS NULL AND anchor_side IS NULL AND anchor_start_line IS NULL AND anchor_end_line IS NULL) OR
      (anchor_kind = 'range' AND anchor_diff_block_id IS NULL AND anchor_file_id IS NOT NULL AND anchor_side IS NOT NULL AND anchor_start_line IS NOT NULL AND anchor_end_line IS NOT NULL AND anchor_start_line <= anchor_end_line)
    ),
    CHECK (
      (state = 'open' AND resolved_by_type IS NULL AND resolved_by_id IS NULL AND resolved_at IS NULL) OR
      (state = 'resolved' AND resolved_by_type IS NOT NULL AND resolved_by_id IS NOT NULL AND resolved_at IS NOT NULL)
    )
  )`,
  "CREATE INDEX threaded_comments_version_idx ON threaded_comments(version_id)",
  "CREATE INDEX threaded_comments_commit_idx ON threaded_comments(commit_id)",
  "CREATE INDEX threaded_comments_file_idx ON threaded_comments(file_id)",
  "CREATE INDEX threaded_comments_diff_block_idx ON threaded_comments(diff_block_id)",
  "CREATE INDEX threaded_comments_thread_idx ON threaded_comments(thread_id)",

  `CREATE TABLE decision_notes (
    id TEXT PRIMARY KEY NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    version_id TEXT REFERENCES review_versions(id) ON DELETE CASCADE,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    body_markdown TEXT NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('human', 'agent', 'system')),
    author_id TEXT NOT NULL,
    author_display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    CHECK (${scopedTargetCheck})
  )`,
  "CREATE INDEX decision_notes_version_idx ON decision_notes(version_id)",
  "CREATE INDEX decision_notes_commit_idx ON decision_notes(commit_id)",
  "CREATE INDEX decision_notes_file_idx ON decision_notes(file_id)",
  "CREATE INDEX decision_notes_diff_block_idx ON decision_notes(diff_block_id)",

  `CREATE TABLE review_plans (
    id TEXT PRIMARY KEY NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    version_id TEXT REFERENCES review_versions(id) ON DELETE CASCADE,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    body_markdown TEXT NOT NULL,
    created_by_type TEXT NOT NULL CHECK (created_by_type IN ('human', 'agent', 'system')),
    created_by_id TEXT NOT NULL,
    created_by_display_name TEXT,
    created_at TEXT NOT NULL,
    updated_by_type TEXT CHECK (updated_by_type IS NULL OR updated_by_type IN ('human', 'agent', 'system')),
    updated_by_id TEXT,
    updated_by_display_name TEXT,
    updated_at TEXT,
    CHECK (${scopedTargetCheck})
  )`,
  "CREATE INDEX review_plans_version_idx ON review_plans(version_id)",
  "CREATE INDEX review_plans_commit_idx ON review_plans(commit_id)",
  "CREATE INDEX review_plans_file_idx ON review_plans(file_id)",
  "CREATE INDEX review_plans_diff_block_idx ON review_plans(diff_block_id)",
];
