import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AddCommentParamsSchema,
  ClassifyFileParamsSchema,
  ClassificationViewSchema,
  CommentDetailSchema,
  CommitFileDetailSchema,
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  DetectorFindingSchema,
  DetectorFindingSummarySchema,
  CompletePlanParamsSchema,
  CreatePlanParamsSchema,
  DecisionDetailSchema,
  FinalizeDecisionParamsSchema,
  PlanDetailSchema,
  PopulateNextVersionParamsSchema,
  PopulateNextVersionResponseSchema,
  ProposeDecisionParamsSchema,
  VersionSummarySchema,
  paginatedResponseSchema,
  type ActorRef,
} from "../domain/schemas/index.js";
import {
  createPromptReviewMcpServer,
  executePromptReviewMcpTool,
  promptReviewMcpTools,
  type PromptReviewMcpContext,
} from "./server.js";

const agent: ActorRef = { type: "agent", id: "agent-1", displayName: "Agent Reviewer" };
const human: ActorRef = { type: "human", id: "human-1", displayName: "Human Reviewer" };

const version = {
  id: "version-1",
  label: "Batch 06",
  status: "open",
  createdAt: 100,
  progress: {
    totalCommits: 1,
    reviewedCommits: 0,
    totalFiles: 1,
    reviewedFiles: 0,
    unresolvedComments: 1,
    pendingDecisions: 1,
    incompletePlans: 0,
    remainingWorkCount: 2,
  },
} satisfies z.infer<typeof VersionSummarySchema>;

const commitFindingSummary = {
  concernSlug: "harness-prompts",
  targetType: "commit",
  targetId: "commit-1",
  count: 1,
  evidenceSummaries: ["Commit touches a mapped prompt review surface."],
} satisfies z.infer<typeof DetectorFindingSummarySchema>;

const fileFindingSummary = {
  concernSlug: "harness-prompts",
  targetType: "commit_file",
  targetId: "file-1",
  count: 1,
  evidenceSummaries: ["File overlaps a mapped prompt builder."],
} satisfies z.infer<typeof DetectorFindingSummarySchema>;

const commit = {
  id: "commit-1",
  versionId: version.id,
  sha: "a".repeat(40),
  title: "Prompt contract",
  status: "needs_classification",
  primaryTagSlug: undefined,
  secondaryTagSlugs: [],
  fileCount: 1,
  detectorFindingSummaries: [commitFindingSummary],
} satisfies z.infer<typeof CommitQueueItemSchema>;

const file = {
  id: "file-1",
  commitId: commit.id,
  path: "codex-rs/core/src/prompt.rs",
  oldPath: "codex-rs/core/src/prompt.rs",
  changeType: "modified",
  status: "needs_classification",
  primaryTagSlug: "prompt.fidelity",
  secondaryTagSlugs: [],
  detectorFindingSummaries: [fileFindingSummary],
} satisfies z.infer<typeof CommitFileQueueItemSchema>;

const fileDetectorFinding = {
  id: "dfnd-file-1",
  runId: "drun-1",
  versionId: version.id,
  commitId: commit.id,
  commitFileId: file.id,
  diffBlockId: null,
  graphNodeId: null,
  graphNodeKey: "harness-prompts:file:codex-rs/core/src/prompt.rs",
  findingKey: "commit-1:file-1:harness-prompts",
  concernSlug: "harness-prompts",
  target: { type: "commit_file", commitFileId: file.id },
  path: file.path,
  side: "new",
  startLine: 10,
  endLine: 13,
  symbol: "buildPrompt",
  marker: null,
  evidenceKind: "symbol",
  title: "Mapped prompt surface changed",
  summary: "File overlaps a mapped prompt builder.",
  evidence: [{ nodeKey: "harness-prompts:file:codex-rs/core/src/prompt.rs", path: file.path }],
  createdAt: 100,
} satisfies z.infer<typeof DetectorFindingSchema>;

const diffBlockDetectorFinding = {
  ...fileDetectorFinding,
  id: "dfnd-block-1",
  diffBlockId: "block-1",
  findingKey: "commit-1:file-1:block-1:harness-prompts",
  target: { type: "diff_block", diffBlockId: "block-1" },
  title: "Mapped prompt diff block changed",
  summary: "Diff block overlaps a mapped prompt builder.",
} satisfies z.infer<typeof DetectorFindingSchema>;

const tag = {
  slug: "prompt.fidelity",
  label: "Prompt Fidelity",
  parentSlug: null,
  description: "Prompt contract behavior changed.",
  examples: ["Instruction movement."],
  pitfalls: ["Incidental wording only."],
  sortOrder: 1,
};

const classification = {
  scope: { type: "commit_file", commitFileId: file.id },
  taggings: [
    {
      id: "tagging-1",
      scope: { type: "commit_file", commitFileId: file.id },
      tag,
      kind: "primary",
      createdBy: agent,
      createdAt: 100,
    },
  ],
  summary: "Classified.",
  updatedBy: agent,
  updatedAt: 100,
} satisfies z.infer<typeof ClassificationViewSchema>;

const comment = {
  id: "comment-1",
  scope: { type: "commit_file", commitFileId: file.id },
  status: "open",
  body: "Check continuation behavior.",
  author: agent,
  createdAt: 100,
  anchor: { kind: "scope" },
  updatedAt: 100,
} satisfies z.infer<typeof CommentDetailSchema>;

const commentSummary = {
  id: comment.id,
  scope: comment.scope,
  status: comment.status,
  body: comment.body,
  author: comment.author,
  createdAt: comment.createdAt,
};

const decision = {
  id: "decision-1",
  scope: { type: "commit_file", commitFileId: file.id },
  status: "proposed",
  outcome: "accept_with_watch",
  proposedBy: agent,
  createdAt: 100,
  updatedAt: 100,
} satisfies z.infer<typeof DecisionDetailSchema>;

const decisionSummary = {
  id: decision.id,
  scope: decision.scope,
  status: decision.status,
  outcome: decision.outcome,
  proposedBy: decision.proposedBy,
  createdAt: decision.createdAt,
};

const plan = {
  id: "plan-1",
  scope: { type: "commit_file", commitFileId: file.id },
  title: "Follow-up plan",
  summary: "Verify prompt behavior.",
  status: "accepted",
  proposedBy: agent,
  createdAt: 100,
  items: [],
  linkedCommentIds: [comment.id],
  linkedDecisionIds: [decision.id],
  linkedDiffBlockIds: ["block-1"],
} satisfies z.infer<typeof PlanDetailSchema>;

const planSummary = {
  id: plan.id,
  scope: plan.scope,
  title: plan.title,
  summary: plan.summary,
  status: plan.status,
  proposedBy: plan.proposedBy,
  createdAt: plan.createdAt,
};

const fileDetail = {
  ...file,
  detectorFindings: [fileDetectorFinding],
  diffBlocks: [
    {
      id: "block-1",
      commitFileId: file.id,
      heading: "system prompt contract",
      oldStartLine: 10,
      oldEndLine: 12,
      newStartLine: 10,
      newEndLine: 13,
      patch: "@@ -10,3 +10,4 @@\n-old autonomy wording\n+new autonomy wording\n+explicit persistence wording",
      taggings: classification.taggings,
      comments: [commentSummary],
      decision: decisionSummary,
      detectorFindings: [diffBlockDetectorFinding],
    },
  ],
  review: {
    taggings: classification.taggings,
    comments: [commentSummary],
    decisions: [decisionSummary],
    plans: [planSummary],
  },
} satisfies z.infer<typeof CommitFileDetailSchema>;

describe("prompt review MCP tools", () => {
  it("registers the required tool names", () => {
    expect(promptReviewMcpTools.map((tool) => tool.name).sort()).toEqual([
      "add_comment",
      "classify_commit",
      "classify_file",
      "complete_plan",
      "create_plan",
      "finalize_decision",
      "get_file_review",
      "list_commit_files",
      "list_concern_tags",
      "list_missing_decisions",
      "list_open_comments",
      "list_remaining_commits",
      "list_versions",
      "populate_next_version",
      "propose_decision",
      "resolve_comment",
      "update_plan",
      "update_plan_item",
    ]);
  });

  it("derives mutation input schemas from shared boundary schemas", () => {
    expect(tool("populate_next_version").inputSchema).toBe(PopulateNextVersionParamsSchema);
    expect(tool("classify_file").inputSchema).toBe(ClassifyFileParamsSchema);
    expect(tool("add_comment").inputSchema).toBe(AddCommentParamsSchema);
    expect(tool("propose_decision").inputSchema).toBe(ProposeDecisionParamsSchema);
    expect(tool("finalize_decision").inputSchema).toBe(FinalizeDecisionParamsSchema);
    expect(tool("create_plan").inputSchema).toBe(CreatePlanParamsSchema);
    expect(tool("complete_plan").inputSchema).toBe(CompletePlanParamsSchema);
  });

  it("validates tool outputs against shared response schemas with next actions", async () => {
    const context = createFakeContext();
    const cases = [
      {
        name: "populate_next_version",
        input: { repositoryId: "repo-1", baseRefOrSha: "main~1", targetRef: "main" },
        schema: PopulateNextVersionResponseSchema.extend({ nextAction: z.object({ description: z.string() }).passthrough() }),
      },
      {
        name: "list_remaining_commits",
        input: { versionId: version.id },
        schema: paginatedResponseSchema(CommitQueueItemSchema).passthrough(),
      },
      {
        name: "list_commit_files",
        input: { commitId: commit.id, remaining: true, limit: 1 },
        schema: paginatedResponseSchema(CommitFileQueueItemSchema).passthrough(),
      },
      { name: "get_file_review", input: { commitFileId: file.id }, schema: z.object({ file: CommitFileDetailSchema }).passthrough() },
      {
        name: "add_comment",
        input: { scope: { type: "commit_file", commitFileId: file.id }, anchor: { kind: "scope" }, body: comment.body, author: agent },
        schema: CommentDetailSchema.passthrough(),
      },
      {
        name: "propose_decision",
        input: {
          scope: { type: "commit_file", commitFileId: file.id },
          outcome: "accept_with_watch",
          proposedBy: agent,
        },
        schema: DecisionDetailSchema.passthrough(),
      },
    ];

    for (const testCase of cases) {
      const result = await executePromptReviewMcpTool(context, tool(testCase.name), testCase.input);
      expect(result.isError, testCase.name).toBeUndefined();
      expect(testCase.schema.parse(result.structuredContent)).toHaveProperty("nextAction");
    }
  });

  it("calls the version ingestion service for population", async () => {
    const calls: unknown[] = [];
    const context = createFakeContext({ populateCalls: calls });
    await executePromptReviewMcpTool(context, tool("populate_next_version"), {
      repositoryId: "repo-1",
      baseRefOrSha: "main~1",
      targetRef: "main",
    });
    expect(calls).toEqual([{ repositoryId: "repo-1", baseRefOrSha: "main~1", targetRef: "main" }]);
  });

  it("returns queue-shaped remaining commits and structured diff blocks", async () => {
    const context = createFakeContext();
    const queue = await executePromptReviewMcpTool(context, tool("list_remaining_commits"), { versionId: version.id });
    expect(queue.structuredContent).toMatchObject({
      data: [
        {
          ...commit,
          detectorFindingSummaries: [
            expect.objectContaining({
              concernSlug: "harness-prompts",
              evidenceSummaries: ["Commit touches a mapped prompt review surface."],
            }),
          ],
        },
      ],
      nextCursor: null,
      returnedCount: 1,
      totalCount: 1,
      hasMore: false,
    });

    const files = await executePromptReviewMcpTool(context, tool("list_commit_files"), { commitId: commit.id });
    expect(files.structuredContent).toMatchObject({
      data: [
        {
          ...file,
          detectorFindingSummaries: [
            expect.objectContaining({
              concernSlug: "harness-prompts",
              evidenceSummaries: ["File overlaps a mapped prompt builder."],
            }),
          ],
        },
      ],
    });

    const review = await executePromptReviewMcpTool(context, tool("get_file_review"), { commitFileId: file.id });
    expect(review.structuredContent).toMatchObject({
      file: {
        id: file.id,
        detectorFindings: [expect.objectContaining({ id: "dfnd-file-1", concernSlug: "harness-prompts" })],
        diffBlocks: [
          {
            id: "block-1",
            patch: expect.stringContaining("@@"),
            detectorFindings: [expect.objectContaining({ id: "dfnd-block-1", target: { type: "diff_block", diffBlockId: "block-1" } })],
          },
        ],
      },
    });
  });

  it("enforces tag command, scope/anchor, and actor validation", async () => {
    const context = createFakeContext();
    const badTag = await executePromptReviewMcpTool(context, tool("classify_file"), {
      commitFileId: file.id,
      primaryTagSlug: "prompt.fidelity",
      secondaryTagSlugs: ["prompt.fidelity"],
    });
    expect(badTag.isError).toBe(true);

    const badAnchor = await executePromptReviewMcpTool(context, tool("add_comment"), {
      scope: { type: "commit_file", commitFileId: file.id },
      anchor: { kind: "block", diffBlockId: "block-1" },
      body: comment.body,
      author: agent,
    });
    expect(badAnchor.isError).toBe(true);

    const proposed = await executePromptReviewMcpTool(context, tool("propose_decision"), {
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "accept",
      proposedBy: agent,
    });
    expect(proposed.isError).toBeUndefined();

    const finalized = await executePromptReviewMcpTool(context, tool("finalize_decision"), {
      decisionId: decision.id,
      status: "accepted",
      finalizer: agent,
    });
    expect(finalized.isError).toBe(true);
  });

  it("routes plan creation and completion through service state", async () => {
    const state = { created: false, completed: false };
    const context = createFakeContext({ planState: state });
    const created = await executePromptReviewMcpTool(context, tool("create_plan"), {
      scope: { type: "commit_file", commitFileId: file.id },
      title: plan.title,
      summary: plan.summary,
      proposedBy: agent,
    });
    expect(created.isError).toBeUndefined();
    expect(state.created).toBe(true);

    const completed = await executePromptReviewMcpTool(context, tool("complete_plan"), {
      planId: plan.id,
      completedBy: human,
      completionNote: "Done.",
    });
    expect(completed.structuredContent).toMatchObject({ status: "complete", nextAction: expect.any(Object) });
    expect(state.completed).toBe(true);
  });

  it("serves JSON resources from service-backed reads", async () => {
    const server = createPromptReviewMcpServer(createFakeContext()) as unknown as {
      _registeredResources: Record<string, { readCallback: (uri: URL) => Promise<{ contents: Array<{ mimeType?: string; text?: string }> }> | { contents: Array<{ mimeType?: string; text?: string }> } }>;
    };
    const resource = server._registeredResources["prompt-reviews://versions"];
    const result = await resource.readCallback(new URL("prompt-reviews://versions"));
    expect(result.contents[0]).toMatchObject({ mimeType: "application/json" });
    expect(JSON.parse(result.contents[0].text ?? "{}")).toEqual({ versions: [version] });
  });

  it("keeps MCP source away from legacy-primary fields and persistence imports", () => {
    const sources = readMcpSources();
    const workflowPatterns = [
      new RegExp("review" + "Path"),
      new RegExp("\\.prompt-review" + "\\.md"),
      new RegExp("\\b" + "bun" + "dle" + "\\b"),
      new RegExp("comments" + "\\.json"),
    ];
    const persistencePatterns = [
      new RegExp("\\/repositories\\/"),
      new RegExp("\\/db\\/"),
      new RegExp("row" + "Schemas"),
      new RegExp("drizzle" + "-orm"),
      new RegExp("better" + "-sqlite3"),
    ];
    for (const [fileName, source] of sources) {
      for (const pattern of workflowPatterns) {
        expect(source, fileName).not.toMatch(pattern);
      }
      for (const pattern of persistencePatterns) {
        expect(source, fileName).not.toMatch(pattern);
      }
    }
  });
});

function tool(name: string) {
  const found = promptReviewMcpTools.find((candidate) => candidate.name === name);
  if (found === undefined) {
    throw new Error(`Missing tool ${name}`);
  }
  return found;
}

function createFakeContext(options: { populateCalls?: unknown[]; planState?: { created: boolean; completed: boolean } } = {}): PromptReviewMcpContext {
  return {
    versions: {
      async populateNextVersion(params) {
        options.populateCalls?.push(params);
        return {
          version,
          baseSha: "b".repeat(40),
          targetSha: "c".repeat(40),
          commitCount: 1,
          fileCount: 1,
          diffBlockCount: 1,
          detector: {
            runCount: 1,
            latestRunId: "drun-mcp",
            latestRunStatus: "succeeded",
            findingCount: 1,
            graphNodeCount: 2,
            graphEdgeCount: 1,
          },
          created: true,
        };
      },
      listVersions: () => [version],
      getVersionDetail: () => ({ ...version, commits: [commit], selectedCommit: undefined, remainingWork: [] }),
      closeVersion: () => ({ ...version, status: "closed" }),
    },
    classification: {
      classifyCommit: () => ({ ...classification, scope: { type: "commit", commitId: commit.id } }),
      classifyFile: (params) => {
        if (
          params !== null &&
          typeof params === "object" &&
          "primaryTagSlug" in params &&
          "secondaryTagSlugs" in params &&
          Array.isArray(params.secondaryTagSlugs) &&
          params.secondaryTagSlugs.includes(params.primaryTagSlug)
        ) {
          throw new Error("Primary tag cannot also be a secondary tag.");
        }
        return classification;
      },
    },
    queue: {
      listRemainingCommits: () => ({ data: [commit], nextCursor: null, returnedCount: 1, totalCount: 1, hasMore: false }),
      listRemainingFiles: () => ({ data: [file], nextCursor: null, returnedCount: 1, totalCount: 1, hasMore: false }),
      listMissingDecisions: () => [file],
      listOpenComments: () => [comment],
      listOpenPlans: () => [plan],
      getRemainingWork: () => [],
    },
    comments: {
      addComment: () => comment,
      resolveComment: () => ({ ...comment, status: "resolved", resolvedBy: human, resolvedAt: 101 }),
      reopenComment: () => comment,
      supersedeComment: () => {
        throw new Error("Unsupported.");
      },
    },
    decisions: {
      proposeDecision: () => decision,
      updateDecision: () => decision,
      finalizeDecision: () => ({ ...decision, status: "accepted", finalizedBy: human, finalizedAt: 101 }),
      supersedeDecision: () => ({ ...decision, status: "superseded", finalizedBy: human, finalizedAt: 101 }),
    },
    plans: {
      createPlan: () => {
        if (options.planState !== undefined) {
          options.planState.created = true;
        }
        return plan;
      },
      updatePlan: () => plan,
      createPlanItem: () => ({
        id: "plan-item-1",
        planId: plan.id,
        title: "Item",
        status: "todo",
        createdAt: 100,
      }),
      updatePlanItem: () => ({
        id: "plan-item-1",
        planId: plan.id,
        title: "Item",
        status: "complete",
        createdAt: 100,
        updatedAt: 101,
      }),
      completePlan: () => {
        if (options.planState !== undefined) {
          options.planState.completed = true;
        }
        return { ...plan, status: "complete", completedBy: human, completedAt: 101 };
      },
    },
    read: {
      listVersions: () => [version],
      getVersionDetail: () => ({ ...version, commits: [commit], selectedCommit: undefined, remainingWork: [] }),
      getCommitDetail: () => ({
        ...commit,
        files: [fileDetail],
        queuedFiles: [file],
        taggings: classification.taggings,
        comments: [commentSummary],
        decisions: [decisionSummary],
        plans: [planSummary],
      }),
      listCommitFiles: () => ({ data: [file], nextCursor: null, returnedCount: 1, totalCount: 1, hasMore: false }),
      getCommitFileDetail: () => fileDetail,
      listConcernTags: () => [tag],
      listComments: () => [comment],
      listMissingDecisions: (params) => (params.target === "commit" ? { target: "commit", data: [commit] } : { target: "file", data: [file] }),
      createTagging: () => classification.taggings[0],
      deleteTagging: () => classification.taggings[0],
    },
  };
}

function readMcpSources(): Array<[string, string]> {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const files: Array<[string, string]> = [];
  collect(root, files);
  return files.filter(([fileName]) => !fileName.endsWith(".test.ts"));
}

function collect(directory: string, files: Array<[string, string]>): void {
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    if (statSync(absolutePath).isDirectory()) {
      collect(absolutePath, files);
    } else if (entry.endsWith(".ts")) {
      files.push([path.relative(directory, absolutePath), readFileSync(absolutePath, "utf8")]);
    }
  }
}
