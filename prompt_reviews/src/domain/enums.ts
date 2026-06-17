export const actorTypes = ["human", "agent", "system"] as const;
export type ActorType = (typeof actorTypes)[number];

export const versionStatuses = ["open", "reviewing", "ready", "closed", "archived"] as const;
export type VersionStatus = (typeof versionStatuses)[number];

export const reviewStatuses = [
  "unreviewed",
  "needs_classification",
  "reviewing",
  "needs_decision",
  "patch_required",
  "accepted",
  "accepted_with_watch",
  "rejected",
  "blocked",
] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const changeTypes = ["added", "modified", "deleted", "renamed", "copied", "mode_changed"] as const;
export type ChangeType = (typeof changeTypes)[number];

export const diffSides = ["old", "new"] as const;
export type DiffSide = (typeof diffSides)[number];

export const commentStatuses = ["open", "resolved", "wont_fix", "superseded"] as const;
export type CommentStatus = (typeof commentStatuses)[number];

export const decisionStatuses = ["proposed", "accepted", "rejected", "superseded"] as const;
export type DecisionStatus = (typeof decisionStatuses)[number];

export const finalDecisionStatuses = ["accepted", "rejected", "superseded"] as const;
export type FinalDecisionStatus = (typeof finalDecisionStatuses)[number];

export const decisionOutcomes = [
  "accept",
  "accept_with_watch",
  "patch_required",
  "reject_for_local_build",
  "needs_tests",
  "needs_policy_decision",
  "blocked_on_context",
] as const;
export type DecisionOutcome = (typeof decisionOutcomes)[number];

export const planStatuses = [
  "draft",
  "proposed",
  "accepted",
  "in_progress",
  "complete",
  "abandoned",
  "superseded",
] as const;
export type PlanStatus = (typeof planStatuses)[number];

export const planItemStatuses = ["todo", "in_progress", "blocked", "complete", "abandoned"] as const;
export type PlanItemStatus = (typeof planItemStatuses)[number];

export const reviewEntityScopeTypes = ["version", "commit", "commit_file", "diff_block"] as const;
export type ReviewEntityScopeType = (typeof reviewEntityScopeTypes)[number];

export const decisionScopeTypes = ["version", "commit", "commit_file"] as const;
export type DecisionScopeType = (typeof decisionScopeTypes)[number];

export const sourceAnchorKinds = ["scope", "block", "range"] as const;
export type SourceAnchorKind = (typeof sourceAnchorKinds)[number];

export const tagKinds = ["primary", "secondary"] as const;
export type TagKind = (typeof tagKinds)[number];

export const commentResolutionStatuses = ["resolved", "wont_fix", "superseded"] as const;
export type CommentResolutionStatus = (typeof commentResolutionStatuses)[number];

export const nextActionKinds = ["classify", "comment", "decide", "plan", "close_version"] as const;
export type NextActionKind = (typeof nextActionKinds)[number];

export const remainingWorkKinds = ["classification", "comment", "decision", "plan", "version_closure"] as const;
export type RemainingWorkKind = (typeof remainingWorkKinds)[number];

export const concernGraphNodeKinds = [
  "file",
  "glob",
  "rust_symbol",
  "string_marker",
  "template_marker",
  "config_key",
  "protocol_shape",
  "tool",
  "permission_profile",
] as const;
export type ConcernGraphNodeKind = (typeof concernGraphNodeKinds)[number];

export const concernGraphEdgeKinds = [
  "include_str",
  "calls",
  "called_by",
  "owns_symbol",
  "matches_marker",
  "expands_to_path",
  "configures",
  "registers",
  "persists",
  "serializes",
  "filters",
  "dispatches",
  "mutates",
  "maps_role",
  "surfaces_tool",
  "gates_permission",
  "reconstructs_history",
] as const;
export type ConcernGraphEdgeKind = (typeof concernGraphEdgeKinds)[number];

export const concernGraphSourceKinds = [
  "concern_map",
  "ast_extractor",
  "text_scanner",
  "graph_builder",
  "manual",
] as const;
export type ConcernGraphSourceKind = (typeof concernGraphSourceKinds)[number];

export const detectorRunKinds = ["version_ingestion", "post_commit_refresh", "manual_refresh", "test"] as const;
export type DetectorRunKind = (typeof detectorRunKinds)[number];

export const detectorRunStatuses = ["running", "succeeded", "failed"] as const;
export type DetectorRunStatus = (typeof detectorRunStatuses)[number];

export const detectorFindingEvidenceKinds = [
  "path",
  "symbol",
  "marker",
  "template_marker",
  "graph_node",
  "graph_edge",
  "diff_block",
] as const;
export type DetectorFindingEvidenceKind = (typeof detectorFindingEvidenceKinds)[number];
