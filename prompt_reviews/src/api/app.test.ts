import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ClassificationViewSchema,
  CommentDetailSchema,
  CommitDetailSchema,
  CommitFileDetailSchema,
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  ConcernTagViewSchema,
  DecisionDetailSchema,
  PlanDetailSchema,
  PlanItemDetailSchema,
  PopulateNextVersionResponseSchema,
  RemainingWorkSchema,
  TaggingViewSchema,
  VersionDetailSchema,
  VersionSummarySchema,
  paginatedResponseSchema,
  type ActorRef,
  type CommentDetail,
  type CommitDetail,
  type CommitFileDetail,
  type CommitFileQueueItem,
  type CommitQueueItem,
  type CommentSummary,
  type ConcernTagView,
  type DetectorFinding,
  type DetectorFindingSummary,
  type DecisionDetail,
  type DecisionSummary,
  type PlanDetail,
  type PlanItemDetail,
  type PlanSummary,
  type TaggingView,
  type VersionDetail,
  type VersionSummary,
} from "../domain/schemas/index.js";
import { PromptReviewServiceError, invariantFailed, notFound } from "../services/errors.js";
import { createPromptReviewsApi, type PromptReviewsApiContext } from "./app.js";

const human: ActorRef = { type: "human", id: "human-1", displayName: "Human Reviewer" };
const agent: ActorRef = { type: "agent", id: "agent-1", displayName: "Agent Reviewer" };

const tag: ConcernTagView = {
  slug: "prompt.fidelity",
  label: "Prompt Fidelity",
  parentSlug: null,
  description: "Prompt contract behavior changed.",
  examples: ["Instruction movement."],
  pitfalls: ["Incidental wording only."],
  sortOrder: 1,
};

const commitFindingSummary: DetectorFindingSummary = {
  concernSlug: "harness-prompts",
  targetType: "commit",
  targetId: "commit-1",
  count: 1,
  evidenceSummaries: ["Commit touches a mapped prompt review surface."],
};

const fileFindingSummary: DetectorFindingSummary = {
  concernSlug: "harness-prompts",
  targetType: "commit_file",
  targetId: "file-1",
  count: 1,
  evidenceSummaries: ["File overlaps a mapped prompt builder."],
};

const commit: CommitQueueItem = {
  id: "commit-1",
  versionId: "version-1",
  sha: "a".repeat(40),
  title: "Structured API commit",
  authorName: "Alice",
  committedAt: 100,
  status: "needs_classification",
  primaryTagSlug: "prompt.fidelity",
  secondaryTagSlugs: [],
  fileCount: 1,
  detectorFindingSummaries: [commitFindingSummary],
};

const file: CommitFileQueueItem = {
  id: "file-1",
  commitId: commit.id,
  path: "src/prompt.ts",
  oldPath: "src/prompt.ts",
  changeType: "modified",
  status: "needs_decision",
  primaryTagSlug: "prompt.fidelity",
  secondaryTagSlugs: [],
  detectorFindingSummaries: [fileFindingSummary],
};

const fileDetectorFinding: DetectorFinding = {
  id: "dfnd-file-1",
  runId: "drun-1",
  versionId: "version-1",
  commitId: commit.id,
  commitFileId: file.id,
  diffBlockId: null,
  graphNodeId: null,
  graphNodeKey: "harness-prompts:file:src/prompt.ts",
  findingKey: "commit-1:file-1:harness-prompts",
  concernSlug: "harness-prompts",
  target: { type: "commit_file", commitFileId: file.id },
  path: file.path,
  side: "new",
  startLine: 1,
  endLine: 3,
  symbol: "buildPrompt",
  marker: null,
  evidenceKind: "symbol",
  title: "Mapped prompt surface changed",
  summary: "File overlaps a mapped prompt builder.",
  evidence: [{ nodeKey: "harness-prompts:file:src/prompt.ts", path: file.path }],
  createdAt: 100,
};

const diffBlockDetectorFinding: DetectorFinding = {
  ...fileDetectorFinding,
  id: "dfnd-block-1",
  diffBlockId: "block-1",
  findingKey: "commit-1:file-1:block-1:harness-prompts",
  target: { type: "diff_block", diffBlockId: "block-1" },
  title: "Mapped prompt diff block changed",
  summary: "Diff block overlaps a mapped prompt builder.",
};

const tagging: TaggingView = {
  id: "tagging-1",
  scope: { type: "commit_file", commitFileId: file.id },
  tag,
  kind: "primary",
  createdBy: agent,
  createdAt: 100,
};

const comment: CommentDetail = {
  id: "comment-1",
  scope: { type: "commit_file", commitFileId: file.id },
  status: "open",
  body: "Please check the fallback behavior.",
  author: agent,
  createdAt: 100,
  anchor: { kind: "scope" },
  updatedAt: 100,
};

const commentSummary: CommentSummary = {
  id: comment.id,
  scope: comment.scope,
  status: comment.status,
  body: comment.body,
  author: comment.author,
  createdAt: comment.createdAt,
};

const decision: DecisionDetail = {
  id: "decision-1",
  scope: { type: "commit_file", commitFileId: file.id },
  status: "proposed",
  outcome: "accept",
  proposedBy: agent,
  createdAt: 100,
  updatedAt: 100,
};

const decisionSummary: DecisionSummary = {
  id: decision.id,
  scope: decision.scope,
  status: decision.status,
  outcome: decision.outcome,
  proposedBy: decision.proposedBy,
  createdAt: decision.createdAt,
};

const planItem: PlanItemDetail = {
  id: "plan-item-1",
  planId: "plan-1",
  title: "Add coverage",
  description: "Cover fallback behavior.",
  status: "complete",
  createdAt: 100,
  updatedAt: 101,
};

const plan: PlanDetail = {
  id: "plan-1",
  scope: { type: "commit_file", commitFileId: file.id },
  title: "Follow-up plan",
  summary: "Test the behavior.",
  status: "proposed",
  proposedBy: agent,
  createdAt: 100,
  items: [planItem],
  linkedCommentIds: [comment.id],
  linkedDecisionIds: [decision.id],
  linkedDiffBlockIds: ["block-1"],
  updatedAt: 100,
};

const planSummary: PlanSummary = {
  id: plan.id,
  scope: plan.scope,
  title: plan.title,
  summary: plan.summary,
  status: plan.status,
  proposedBy: plan.proposedBy,
  createdAt: plan.createdAt,
};

const version: VersionSummary = {
  id: "version-1",
  label: "Batch 05",
  status: "open",
  createdAt: 100,
  updatedAt: 100,
  progress: {
    totalCommits: 1,
    reviewedCommits: 0,
    totalFiles: 1,
    reviewedFiles: 0,
    unresolvedComments: 1,
    pendingDecisions: 1,
    incompletePlans: 1,
    remainingWorkCount: 3,
  },
};

const commitDetail: CommitDetail = {
  ...commit,
  message: "Structured API details.",
  files: [],
  queuedFiles: [file],
  taggings: [tagging],
  comments: [commentSummary],
  decisions: [decisionSummary],
  plans: [planSummary],
};

const fileDetail: CommitFileDetail = {
  ...file,
  detectorFindings: [fileDetectorFinding],
  diffBlocks: [
    {
      id: "block-1",
      commitFileId: file.id,
      heading: "function changed",
      oldStartLine: 1,
      oldEndLine: 2,
      newStartLine: 1,
      newEndLine: 3,
      patch: "@@ -1,2 +1,3 @@\n-old\n+new\n+extra",
      taggings: [tagging],
      comments: [commentSummary],
      decision: decisionSummary,
      detectorFindings: [diffBlockDetectorFinding],
    },
  ],
  review: {
    taggings: [tagging],
    comments: [commentSummary],
    decisions: [decisionSummary],
    plans: [planSummary],
  },
};

const versionDetail: VersionDetail = {
  ...version,
  description: "Structured domain version.",
  commits: [commit],
  selectedCommit: commitDetail,
  remainingWork: [
    {
      kind: "decision",
      label: "Files need human-final decisions",
      count: 1,
      targetIds: [file.id],
      blockingComments: [],
      pendingDecisions: [],
      incompletePlans: [],
      nextActions: [{ type: "decide", label: "Decide src/prompt.ts", targetId: file.id }],
    },
  ],
};

let app: Awaited<ReturnType<typeof createPromptReviewsApi>> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("prompt reviews API scaffold", () => {
  it("parses successful endpoint responses through boundary schemas", async () => {
    app = await createPromptReviewsApi({ context: createFakeContext() });
    const cases = [
      {
        method: "POST",
        url: "/api/versions/populate-next",
        payload: { repositoryId: "repo-1", baseRefOrSha: "main~1", targetRef: "main" },
        status: 201,
        schema: PopulateNextVersionResponseSchema,
      },
      { method: "GET", url: "/api/versions?status=open", schema: z.object({ versions: z.array(VersionSummarySchema) }) },
      { method: "GET", url: "/api/versions/version-1", schema: VersionDetailSchema },
      { method: "PATCH", url: "/api/versions/version-1", payload: {}, schema: VersionDetailSchema },
      {
        method: "POST",
        url: "/api/versions/version-1/close",
        payload: { finalizer: human, summary: "Done." },
        schema: VersionSummarySchema,
      },
      {
        method: "GET",
        url: "/api/versions/version-1/commits?remaining=true&limit=1",
        schema: paginatedResponseSchema(CommitQueueItemSchema),
      },
      { method: "GET", url: "/api/commits/commit-1", schema: CommitDetailSchema },
      {
        method: "PATCH",
        url: "/api/commits/commit-1/classification",
        payload: { primaryTagSlug: tag.slug, secondaryTagSlugs: [] },
        schema: ClassificationViewSchema,
      },
      {
        method: "GET",
        url: "/api/commits/commit-1/files?remaining=true",
        schema: paginatedResponseSchema(CommitFileQueueItemSchema),
      },
      { method: "GET", url: "/api/commit-files/file-1", schema: CommitFileDetailSchema },
      {
        method: "PATCH",
        url: "/api/commit-files/file-1/classification",
        payload: { primaryTagSlug: tag.slug },
        schema: ClassificationViewSchema,
      },
      { method: "GET", url: "/api/concern-tags", schema: z.object({ tags: z.array(ConcernTagViewSchema) }) },
      {
        method: "POST",
        url: "/api/taggings",
        payload: { scope: { type: "commit_file", commitFileId: file.id }, tagSlug: tag.slug, kind: "primary", actor: agent },
        status: 201,
        schema: TaggingViewSchema,
      },
      { method: "DELETE", url: "/api/taggings/tagging-1", payload: { actor: human }, schema: TaggingViewSchema },
      {
        method: "POST",
        url: "/api/comments",
        payload: {
          scope: { type: "commit_file", commitFileId: file.id },
          anchor: { kind: "scope" },
          body: comment.body,
          author: agent,
        },
        status: 201,
        schema: CommentDetailSchema,
      },
      { method: "GET", url: "/api/comments?commitFileId=file-1&status=open", schema: z.object({ comments: z.array(CommentDetailSchema) }) },
      {
        method: "PATCH",
        url: "/api/comments/comment-1/resolve",
        payload: { status: "resolved", actor: human },
        schema: CommentDetailSchema,
      },
      {
        method: "PATCH",
        url: "/api/comments/comment-1/reopen",
        payload: { actor: human },
        schema: CommentDetailSchema,
      },
      {
        method: "POST",
        url: "/api/decisions",
        payload: {
          scope: { type: "commit_file", commitFileId: file.id },
          outcome: "accept",
          proposedBy: agent,
        },
        status: 201,
        schema: DecisionDetailSchema,
      },
      {
        method: "PATCH",
        url: "/api/decisions/decision-1",
        payload: { outcome: "accept_with_watch", actor: human },
        schema: DecisionDetailSchema,
      },
      {
        method: "POST",
        url: "/api/decisions/decision-1/finalize",
        payload: { status: "accepted", finalizer: human },
        schema: DecisionDetailSchema,
      },
      {
        method: "GET",
        url: "/api/versions/version-1/missing-decisions?target=file",
        schema: z.object({ target: z.literal("file"), data: z.array(CommitFileQueueItemSchema) }),
      },
      {
        method: "POST",
        url: "/api/plans",
        payload: {
          scope: { type: "commit_file", commitFileId: file.id },
          title: plan.title,
          summary: plan.summary,
          proposedBy: agent,
          commentIds: [comment.id],
        },
        status: 201,
        schema: PlanDetailSchema,
      },
      {
        method: "PATCH",
        url: "/api/plans/plan-1",
        payload: { title: "Updated plan", actor: human },
        schema: PlanDetailSchema,
      },
      {
        method: "POST",
        url: "/api/plans/plan-1/items",
        payload: { title: "Add another item", actor: human },
        status: 201,
        schema: PlanItemDetailSchema,
      },
      {
        method: "PATCH",
        url: "/api/plan-items/plan-item-1",
        payload: { status: "complete", actor: human },
        schema: PlanItemDetailSchema,
      },
      {
        method: "POST",
        url: "/api/plans/plan-1/complete",
        payload: { completedBy: human, completionNote: "All set." },
        schema: PlanDetailSchema,
      },
      {
        method: "GET",
        url: "/api/versions/version-1/remaining-work",
        schema: z.object({ remainingWork: z.array(RemainingWorkSchema) }),
      },
    ];

    for (const testCase of cases) {
      const response = await app.inject({
        method: testCase.method,
        url: testCase.url,
        payload: testCase.payload,
      });
      expect(response.statusCode, `${testCase.method} ${testCase.url}`).toBe(testCase.status ?? 200);
      expect(() => testCase.schema.parse(response.json())).not.toThrow();
    }
  });

  it("returns stable validation, not-found, authority, and conflict errors", async () => {
    app = await createPromptReviewsApi({ context: createFakeContext() });

    await expectStatus("POST", "/api/comments", 400, { scope: { type: "commit_file", commitFileId: file.id }, body: "" });
    await expectStatus("GET", "/api/versions?status=invalid", 400);
    await expectStatus("GET", "/api/commits/missing", 404);
    await expectStatus("POST", "/api/decisions/decision-1/finalize", 403, {
      status: "accepted",
      finalizer: agent,
    });
    await expectStatus("POST", "/api/plans/plan-1/complete", 409, {
      completedBy: human,
      completionNote: "Blocked.",
    });
  });
});

async function expectStatus(method: string, url: string, statusCode: number, payload?: unknown): Promise<void> {
  if (app === undefined) {
    throw new Error("Expected app.");
  }
  const response = await app.inject({ method, url, payload });
  expect(response.statusCode, `${method} ${url}`).toBe(statusCode);
  expect(response.json()).toHaveProperty("error.code");
}

function createFakeContext(): PromptReviewsApiContext {
  const classification = {
    scope: { type: "commit_file", commitFileId: file.id },
    taggings: [tagging],
    updatedBy: agent,
    updatedAt: 100,
  } satisfies z.infer<typeof ClassificationViewSchema>;

  return {
    versions: {
      async populateNextVersion() {
        return {
          version,
          baseSha: "b".repeat(40),
          targetSha: "c".repeat(40),
          commitCount: 1,
          fileCount: 1,
          diffBlockCount: 1,
          detector: {
            runCount: 1,
            latestRunId: "drun-api",
            latestRunStatus: "succeeded",
            findingCount: 1,
            graphNodeCount: 2,
            graphEdgeCount: 1,
          },
          created: true,
        };
      },
      listVersions() {
        return [version];
      },
      getVersionDetail(params) {
        if (params !== null && typeof params === "object" && "versionId" in params && params.versionId === "missing") {
          throw notFound("version", "missing");
        }
        return versionDetail;
      },
      closeVersion(params) {
        if (params !== null && typeof params === "object" && "finalizer" in params) {
          const finalizer = (params as { finalizer: ActorRef }).finalizer;
          if (finalizer.type !== "human") {
            throw new PromptReviewServiceError("invariant_failed", "Only human actors may close versions.");
          }
        }
        return { ...version, status: "closed", closedAt: 101 };
      },
    },
    classification: {
      classifyCommit() {
        return { ...classification, scope: { type: "commit", commitId: commit.id } };
      },
      classifyFile() {
        return classification;
      },
    },
    status: {
      recomputeFileStatus() {
        return { id: file.id, status: file.status };
      },
      recomputeCommitStatus() {
        return { id: commit.id, status: commit.status };
      },
      recomputeVersionStatus() {
        return { id: version.id, status: version.status };
      },
      overrideFileStatus() {
        return { id: file.id, status: file.status };
      },
      overrideCommitStatus() {
        return { id: commit.id, status: commit.status };
      },
    },
    queue: {
      listRemainingCommits() {
        return { data: [commit], nextCursor: "next-commit", returnedCount: 1, totalCount: 2, hasMore: true };
      },
      listRemainingFiles() {
        return { data: [file], nextCursor: null, returnedCount: 1, totalCount: 1, hasMore: false };
      },
      listMissingDecisions() {
        return [file];
      },
      listOpenComments() {
        return [commentSummary];
      },
      listOpenPlans() {
        return [planSummary];
      },
      getRemainingWork() {
        return versionDetail.remainingWork;
      },
    },
    comments: {
      addComment() {
        return comment;
      },
      resolveComment() {
        return { ...comment, status: "resolved", resolvedAt: 101, resolvedBy: human };
      },
      reopenComment() {
        return comment;
      },
      supersedeComment() {
        throw invariantFailed("Not supported.");
      },
    },
    decisions: {
      proposeDecision() {
        return decision;
      },
      updateDecision() {
        return { ...decision, outcome: "accept_with_watch" };
      },
      finalizeDecision(params) {
        if (params !== null && typeof params === "object" && "finalizer" in params) {
          const finalizer = (params as { finalizer: ActorRef }).finalizer;
          if (finalizer.type !== "human") {
            throw new PromptReviewServiceError("invariant_failed", "Only human actors may finalize decisions.");
          }
        }
        return { ...decision, status: "accepted", finalizedBy: human, finalizedAt: 101 };
      },
      supersedeDecision() {
        return { ...decision, status: "superseded", finalizedBy: human, finalizedAt: 101 };
      },
    },
    plans: {
      createPlan() {
        return plan;
      },
      updatePlan() {
        return { ...plan, title: "Updated plan" };
      },
      createPlanItem() {
        return planItem;
      },
      updatePlanItem() {
        return planItem;
      },
      completePlan(params) {
        if (
          params !== null &&
          typeof params === "object" &&
          "completionNote" in params &&
          params.completionNote === "Blocked."
        ) {
          throw invariantFailed("Cannot complete a plan while it has incomplete items.");
        }
        return { ...plan, status: "complete", completedBy: human, completedAt: 101 };
      },
    },
    read: {
      listVersions() {
        return [version];
      },
      getVersionDetail() {
        return versionDetail;
      },
      getCommitDetail(commitId) {
        if (commitId === "missing") {
          throw notFound("commit", commitId);
        }
        return commitDetail;
      },
      listCommitFiles() {
        return { data: [file], nextCursor: null, returnedCount: 1, totalCount: 1, hasMore: false };
      },
      getCommitFileDetail() {
        return fileDetail;
      },
      listConcernTags() {
        return [tag];
      },
      createTagging() {
        return tagging;
      },
      deleteTagging() {
        return tagging;
      },
      listComments() {
        return [comment];
      },
      listMissingDecisions(params) {
        return params.target === "commit"
          ? { target: params.target, data: [commit] }
          : { target: params.target, data: [file] };
      },
    },
  };
}
