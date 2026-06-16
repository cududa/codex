import { describe, expect, it } from "vitest";
import {
  commentResolutionStatuses,
  commentStatuses,
  decisionOutcomes,
  decisionStatuses,
  finalDecisionStatuses,
  tagKinds,
} from "../enums.js";
import {
  AddCommentParamsSchema,
  ClassifyCommitParamsSchema,
  ClassifyFileParamsSchema,
  ClassificationViewSchema,
  CloseVersionParamsSchema,
  CommentDetailSchema,
  CommentSummarySchema,
  CommitDetailSchema,
  CommitFileDetailSchema,
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  CompletePlanParamsSchema,
  ConcernTagViewSchema,
  CreatePlanItemParamsSchema,
  CreatePlanParamsSchema,
  CreateTaggingParamsSchema,
  DecisionDetailSchema,
  DecisionSummarySchema,
  DeleteTaggingParamsSchema,
  DiffBlockViewSchema,
  FileReviewViewSchema,
  FinalizeDecisionParamsSchema,
  NextActionHintSchema,
  OverrideCommitStatusParamsSchema,
  OverrideFileStatusParamsSchema,
  PaginatedResponseSchema,
  PlanDetailSchema,
  PlanItemDetailSchema,
  PlanSummarySchema,
  PopulateNextVersionParamsSchema,
  PopulateNextVersionResponseSchema,
  ProposeDecisionParamsSchema,
  RemainingWorkSchema,
  ReopenCommentParamsSchema,
  ResolveCommentParamsSchema,
  TaggingViewSchema,
  UpdateDecisionParamsSchema,
  UpdatePlanItemParamsSchema,
  UpdatePlanParamsSchema,
  VersionDetailSchema,
  VersionProgressSchema,
  VersionSummarySchema,
} from "./index.js";

const agent = { type: "agent", id: "agent-1", displayName: "Agent" } as const;
const human = { type: "human", id: "human-1", displayName: "Reviewer" } as const;
const fileScope = { type: "commit_file", commitFileId: "cf-1" } as const;
const decisionScope = fileScope;
const tag = {
  slug: "goal.initial-steering",
  label: "Initial Steering",
  parentSlug: "goal-steering-contract",
  description: "Initial user-goal framing and first-turn steering.",
  examples: ["Goal creation prompts"],
  pitfalls: ["Over-weighting inferred goals"],
  sortOrder: 1100,
};
const tagging = {
  id: "tagging-1",
  scope: fileScope,
  tag,
  kind: "primary",
  rationale: "This file changes goal setup.",
  createdBy: agent,
  createdAt: 1,
};
const classification = {
  scope: fileScope,
  taggings: [tagging],
  summary: "Prompt steering change with low blast radius.",
  riskLevel: "low",
  confidence: "high",
  updatedBy: agent,
  updatedAt: 1,
};
const commentSummary = {
  id: "comment-1",
  scope: fileScope,
  status: "open",
  body: "Needs a closer look.",
  author: agent,
  createdAt: 2,
};
const commentDetail = {
  ...commentSummary,
  anchor: { kind: "scope" },
  updatedAt: 3,
};
const decisionSummary = {
  id: "decision-1",
  scope: decisionScope,
  status: "accepted",
  outcome: "accept_with_watch",
  rationale: "The behavior is acceptable with follow-up monitoring.",
  proposedBy: agent,
  finalizedBy: human,
  createdAt: 4,
  finalizedAt: 5,
};
const decisionDetail = {
  ...decisionSummary,
  riskLevel: "medium",
  confidence: "high",
  updatedAt: 6,
};
const planItem = {
  id: "plan-item-1",
  planId: "plan-1",
  title: "Add regression evidence",
  description: "Capture the affected prompt path.",
  status: "complete",
  commitFileId: "cf-1",
  decisionId: "decision-1",
  createdAt: 7,
};
const planSummary = {
  id: "plan-1",
  scope: decisionScope,
  title: "Follow-up evidence",
  summary: "Track remaining validation work.",
  status: "complete",
  proposedBy: agent,
  createdAt: 8,
  completedAt: 9,
};
const planDetail = {
  ...planSummary,
  items: [planItem],
  linkedCommentIds: ["comment-1"],
  linkedDecisionIds: ["decision-1"],
  linkedDiffBlockIds: ["block-1"],
  completedBy: agent,
  completionNote: "Evidence captured.",
};
const diffBlock = {
  id: "block-1",
  commitFileId: "cf-1",
  heading: "Prompt construction",
  oldStartLine: 10,
  oldEndLine: 12,
  newStartLine: 10,
  newEndLine: 13,
  patch: "@@ -10,2 +10,3 @@\n-context\n+updated context",
  taggings: [tagging],
  comments: [commentSummary],
  decision: decisionSummary,
};
const fileQueueItem = {
  id: "cf-1",
  commitId: "commit-1",
  path: "codex-rs/core/src/prompt.rs",
  oldPath: "codex-rs/core/src/old_prompt.rs",
  changeType: "modified",
  status: "accepted_with_watch",
  primaryTagSlug: "goal.initial-steering",
  secondaryTagSlugs: ["prompt.fidelity"],
};
const fileReview = {
  file: fileQueueItem,
  taggings: [tagging],
  comments: [commentSummary],
  decisions: [decisionSummary],
  plans: [planSummary],
};
const fileDetail = {
  ...fileQueueItem,
  diffBlocks: [diffBlock],
  review: {
    taggings: [tagging],
    comments: [commentSummary],
    decisions: [decisionSummary],
    plans: [planSummary],
  },
};
const commitQueueItem = {
  id: "commit-1",
  versionId: "version-1",
  sha: "abc123",
  title: "Adjust goal prompt construction",
  authorName: "OpenAI",
  committedAt: 10,
  status: "accepted_with_watch",
  primaryTagSlug: "goal.initial-steering",
  secondaryTagSlugs: ["prompt.fidelity"],
  fileCount: 1,
};
const commitDetail = {
  ...commitQueueItem,
  message: "Adjust goal prompt construction\n\nKeep continuation behavior stable.",
  files: [fileDetail],
  queuedFiles: [fileQueueItem],
  taggings: [tagging],
  comments: [commentSummary],
  decisions: [decisionSummary],
  plans: [planSummary],
};
const nextAction = {
  type: "close_version",
  label: "Close version",
  targetId: "version-1",
  reason: "All work is complete.",
};
const remainingWork = {
  kind: "version_closure",
  label: "Close the reviewed version",
  count: 1,
  targetIds: ["version-1"],
  blockingComments: [commentSummary],
  pendingDecisions: [decisionSummary],
  incompletePlans: [planSummary],
  nextActions: [nextAction],
};
const progress = {
  totalCommits: 1,
  reviewedCommits: 1,
  totalFiles: 1,
  reviewedFiles: 1,
  unresolvedComments: 1,
  pendingDecisions: 0,
  incompletePlans: 0,
  remainingWorkCount: 1,
};
const versionSummary = {
  id: "version-1",
  label: "Upstream batch 1",
  status: "ready",
  createdAt: 11,
  updatedAt: 12,
  progress,
};
const versionDetail = {
  ...versionSummary,
  description: "Prompt review version for upstream changes.",
  commits: [commitQueueItem],
  selectedCommit: commitDetail,
  remainingWork: [remainingWork],
};

describe("boundary command schemas", () => {
  it("parses representative command payloads", () => {
    const commands = [
      [
        PopulateNextVersionParamsSchema,
        {
          repositoryId: "repo-1",
          baseVersionId: "version-0",
          baseRefOrSha: "abc123",
          targetRef: "upstream/main",
          label: "Next",
        },
      ],
      [
        ClassifyCommitParamsSchema,
        {
          commitId: "commit-1",
          primaryTagSlug: "goal.initial-steering",
          summary: "Prompt steering change.",
          riskLevel: "low",
          confidence: "high",
        },
      ],
      [ClassifyFileParamsSchema, { commitFileId: "cf-1", primaryTagSlug: "prompt.fidelity" }],
      [
        OverrideCommitStatusParamsSchema,
        { commitId: "commit-1", status: "blocked", reason: "Needs manual review.", actor: human },
      ],
      [
        OverrideFileStatusParamsSchema,
        { commitFileId: "cf-1", status: "patch_required", reason: "Needs patch.", actor: human },
      ],
      [CreateTaggingParamsSchema, { scope: fileScope, tagSlug: "prompt.fidelity", kind: "secondary", actor: agent }],
      [DeleteTaggingParamsSchema, { taggingId: "tagging-1", actor: human, reason: "Replaced by primary tag." }],
      [AddCommentParamsSchema, { scope: fileScope, anchor: { kind: "scope" }, body: "Please verify.", author: agent }],
      [ResolveCommentParamsSchema, { commentId: "comment-1", status: "resolved", resolution: "Done.", actor: human }],
      [ReopenCommentParamsSchema, { commentId: "comment-1", reason: "Regression returned.", actor: agent }],
      [ProposeDecisionParamsSchema, { scope: decisionScope, outcome: "accept", rationale: "Looks good.", proposedBy: agent }],
      [UpdateDecisionParamsSchema, { decisionId: "decision-1", outcome: "needs_tests", actor: agent }],
      [FinalizeDecisionParamsSchema, { decisionId: "decision-1", status: "accepted", finalizer: human }],
      [
        CreatePlanParamsSchema,
        { scope: decisionScope, title: "Validate", proposedBy: agent, commentIds: ["comment-1"], diffBlockIds: ["block-1"] },
      ],
      [UpdatePlanParamsSchema, { planId: "plan-1", status: "in_progress", decisionIds: ["decision-1"], actor: agent }],
      [
        CreatePlanItemParamsSchema,
        { planId: "plan-1", title: "Run focused tests", actor: agent, commitFileId: "cf-1" },
      ],
      [
        UpdatePlanItemParamsSchema,
        { planItemId: "plan-item-1", status: "complete", actor: agent, decisionId: "decision-1" },
      ],
      [CompletePlanParamsSchema, { planId: "plan-1", completedBy: agent, completionNote: "Finished." }],
      [CloseVersionParamsSchema, { versionId: "version-1", finalizer: human, summary: "Closed after review." }],
    ] as const;

    expect(commands.map(([schema, value]) => schema.safeParse(value).success)).toEqual(commands.map(() => true));
  });

  it("rejects mismatched anchors and non-human finalizers", () => {
    expect(
      AddCommentParamsSchema.safeParse({
        scope: { type: "commit", commitId: "commit-1" },
        anchor: { kind: "range", commitFileId: "cf-1", side: "new", startLine: 1, endLine: 1 },
        body: "Wrong target.",
        author: agent,
      }).success,
    ).toBe(false);
    expect(
      FinalizeDecisionParamsSchema.safeParse({
        decisionId: "decision-1",
        status: "accepted",
        finalizer: agent,
      }).success,
    ).toBe(false);
  });

  it("rejects legacy artifact fields on strict command boundaries", () => {
    expect(
      ClassifyCommitParamsSchema.safeParse({
        commitId: "commit-1",
        primaryTagSlug: "goal.initial-steering",
        reviewPath: "old",
        bundle: {},
        markdown_path: "old",
        folder: "old",
      }).success,
    ).toBe(false);
  });
});

describe("boundary view and response schemas", () => {
  it("parses representative view payloads", () => {
    const responses = [
      [VersionSummarySchema, versionSummary],
      [
        PopulateNextVersionResponseSchema,
        {
          version: versionSummary,
          baseSha: "abc123",
          targetSha: "def456",
          commitCount: 1,
          fileCount: 1,
          diffBlockCount: 1,
          created: true,
        },
      ],
      [VersionDetailSchema, versionDetail],
      [VersionProgressSchema, progress],
      [CommitQueueItemSchema, commitQueueItem],
      [CommitDetailSchema, commitDetail],
      [CommitFileQueueItemSchema, fileQueueItem],
      [CommitFileDetailSchema, fileDetail],
      [DiffBlockViewSchema, diffBlock],
      [FileReviewViewSchema, fileReview],
      [ConcernTagViewSchema, tag],
      [TaggingViewSchema, tagging],
      [ClassificationViewSchema, classification],
      [CommentSummarySchema, commentSummary],
      [CommentDetailSchema, commentDetail],
      [DecisionSummarySchema, decisionSummary],
      [DecisionDetailSchema, decisionDetail],
      [PlanSummarySchema, planSummary],
      [PlanDetailSchema, planDetail],
      [PlanItemDetailSchema, planItem],
      [RemainingWorkSchema, remainingWork],
      [PaginatedResponseSchema, { data: [commitQueueItem], nextCursor: null, returnedCount: 1, totalCount: 1, hasMore: false }],
      [NextActionHintSchema, nextAction],
    ] as const;

    expect(responses.map(([schema, value]) => schema.safeParse(value).success)).toEqual(responses.map(() => true));
  });

  it("derives enum-like fields from shared enum arrays", () => {
    expect({
      tagKinds,
      commentStatuses,
      commentResolutionStatuses,
      decisionStatuses,
      finalDecisionStatuses,
      decisionOutcomes,
      primaryTagging: CreateTaggingParamsSchema.safeParse({
        scope: fileScope,
        tagSlug: "goal.initial-steering",
        kind: tagKinds[0],
        actor: agent,
      }).success,
      currentCommentStatus: CommentSummarySchema.safeParse({
        ...commentSummary,
        status: commentStatuses[0],
      }).success,
      resolvedCommentStatus: ResolveCommentParamsSchema.safeParse({
        commentId: "comment-1",
        status: commentResolutionStatuses[0],
        resolution: "Done.",
        actor: human,
      }).success,
      decision: ProposeDecisionParamsSchema.safeParse({
        scope: decisionScope,
        outcome: decisionOutcomes[0],
        rationale: "Accepted.",
        proposedBy: agent,
      }).success,
    }).toEqual({
      tagKinds: ["primary", "secondary"],
      commentStatuses: ["open", "resolved", "wont_fix", "superseded"],
      commentResolutionStatuses: ["resolved", "wont_fix", "superseded"],
      decisionStatuses: ["proposed", "accepted", "rejected", "superseded"],
      finalDecisionStatuses: ["accepted", "rejected", "superseded"],
      decisionOutcomes: [
        "accept",
        "accept_with_watch",
        "patch_required",
        "reject_for_local_build",
        "needs_tests",
        "needs_policy_decision",
        "blocked_on_context",
      ],
      primaryTagging: true,
      currentCommentStatus: true,
      resolvedCommentStatus: true,
      decision: true,
    });
  });
});
