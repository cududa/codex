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

export const detectorStatements = [
  `CREATE TABLE detector_runs (
    id TEXT PRIMARY KEY NOT NULL,
    version_id TEXT NOT NULL REFERENCES review_versions(id) ON DELETE CASCADE,
    concern_map_version INTEGER NOT NULL CHECK (concern_map_version > 0),
    state TEXT NOT NULL CHECK (state IN ('running', 'completed', 'failed')),
    started_at TEXT NOT NULL,
    completed_at TEXT,
    failure_message TEXT,
    CHECK (
      (state = 'running' AND completed_at IS NULL AND failure_message IS NULL) OR
      (state = 'completed' AND completed_at IS NOT NULL AND failure_message IS NULL) OR
      (state = 'failed' AND failure_message IS NOT NULL)
    )
  )`,
  "CREATE INDEX detector_runs_version_idx ON detector_runs(version_id)",

  `CREATE TABLE detector_evidence (
    id TEXT PRIMARY KEY NOT NULL,
    run_id TEXT NOT NULL REFERENCES detector_runs(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
    version_id TEXT REFERENCES review_versions(id) ON DELETE CASCADE,
    commit_id TEXT REFERENCES review_commits(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES review_files(id) ON DELETE CASCADE,
    diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    concern_area_slug TEXT NOT NULL CHECK (${concernSlugCheck}),
    suggested_review_mark TEXT CHECK (suggested_review_mark IS NULL OR suggested_review_mark IN ('PASS', 'FLAG', 'MODIFY', 'DONE')),
    title TEXT NOT NULL,
    summary TEXT,
    detail_kind TEXT NOT NULL CHECK (detail_kind IN ('path', 'symbol', 'marker', 'templateMarker', 'diff', 'graph')),
    detail_path TEXT,
    detail_symbol_name TEXT,
    detail_marker TEXT,
    detail_diff_block_id TEXT REFERENCES diff_blocks(id) ON DELETE CASCADE,
    detail_side TEXT CHECK (detail_side IS NULL OR detail_side IN ('old', 'new')),
    detail_start_line INTEGER,
    detail_end_line INTEGER,
    detail_graph_node_id TEXT,
    detail_graph_node_label TEXT,
    created_at TEXT NOT NULL,
    CHECK (${scopedTargetCheck}),
    CHECK (detail_start_line IS NULL OR detail_end_line IS NULL OR detail_start_line <= detail_end_line),
    CHECK (
      (detail_kind = 'path' AND detail_path IS NOT NULL AND detail_symbol_name IS NULL AND detail_marker IS NULL AND detail_diff_block_id IS NULL AND detail_graph_node_id IS NULL) OR
      (detail_kind = 'symbol' AND detail_symbol_name IS NOT NULL AND detail_marker IS NULL AND detail_diff_block_id IS NULL AND detail_graph_node_id IS NULL) OR
      (detail_kind = 'marker' AND detail_marker IS NOT NULL AND detail_symbol_name IS NULL AND detail_diff_block_id IS NULL AND detail_graph_node_id IS NULL) OR
      (detail_kind = 'templateMarker' AND detail_marker IS NOT NULL AND detail_symbol_name IS NULL AND detail_diff_block_id IS NULL AND detail_graph_node_id IS NULL) OR
      (detail_kind = 'diff' AND detail_diff_block_id IS NOT NULL AND detail_symbol_name IS NULL AND detail_marker IS NULL AND detail_graph_node_id IS NULL) OR
      (detail_kind = 'graph' AND detail_graph_node_id IS NOT NULL AND detail_symbol_name IS NULL AND detail_marker IS NULL AND detail_diff_block_id IS NULL)
    )
  )`,
  "CREATE INDEX detector_evidence_run_idx ON detector_evidence(run_id)",
  "CREATE INDEX detector_evidence_commit_idx ON detector_evidence(commit_id)",
  "CREATE INDEX detector_evidence_file_idx ON detector_evidence(file_id)",
  "CREATE INDEX detector_evidence_diff_block_idx ON detector_evidence(diff_block_id)",
];
