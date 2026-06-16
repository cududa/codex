import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedConcernTags } from "../db/seedConcernTags.js";
import type { GitClient } from "../git/gitClient.js";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createVersion,
} from "../repositories/index.js";
import {
  createClassificationService,
  createCommentService,
  createDecisionService,
  createPlanService,
  createReviewQueueService,
  createReviewReadService,
  createServiceContext,
  createStatusService,
  createVersionService,
} from "../services/index.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import { createPromptReviewsApi, type PromptReviewsApiContext } from "./app.js";

const human = { type: "human", id: "human-1", displayName: "Human Reviewer" } as const;
const agent = { type: "agent", id: "agent-1", displayName: "Agent Reviewer" } as const;
const tagSlug = "prompt.fidelity";

type SeededReview = {
  versionId: string;
  closedVersionId: string;
  firstCommitId: string;
  secondCommitId: string;
  firstFileId: string;
  secondFileId: string;
  diffBlockId: string;
};

let database: TempPromptReviewsDatabase | undefined;
let app: FastifyInstance | undefined;
let seeded: SeededReview;

beforeEach(async () => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  seedConcernTags(database.db);
  seeded = seedReview(database);
  app = await createPromptReviewsApi({ context: createDbBackedContext(database) });
});

afterEach(async () => {
  await app?.close();
  app = undefined;
  database?.cleanup();
  database = undefined;
});

describe("prompt reviews API with a temp database", () => {
  it("serves real version, queue, detail, and remaining-work reads", async () => {
    const versions = await injectJson("GET", "/api/versions?status=open");
    expect(versions).toMatchObject({
      versions: [
        {
          id: seeded.versionId,
          label: "Batch 05 DB review",
          status: "open",
          progress: {
            totalCommits: 2,
            totalFiles: 2,
          },
        },
      ],
    });

    const firstPage = await injectJson("GET", `/api/versions/${seeded.versionId}/commits?remaining=true&limit=1`);
    expect(firstPage).toMatchObject({
      data: [expect.objectContaining({ id: seeded.firstCommitId })],
      returnedCount: 1,
      totalCount: 2,
      hasMore: true,
    });
    expect(firstPage.nextCursor).toEqual(expect.any(String));

    const secondPage = await injectJson(
      "GET",
      `/api/versions/${seeded.versionId}/commits?remaining=true&limit=1&cursor=${encodeURIComponent(firstPage.nextCursor)}`,
    );
    expect(secondPage).toMatchObject({
      data: [expect.objectContaining({ id: seeded.secondCommitId })],
      nextCursor: null,
      returnedCount: 1,
      totalCount: 2,
      hasMore: false,
    });

    const files = await injectJson("GET", `/api/commits/${seeded.firstCommitId}/files?remaining=true`);
    expect(files).toMatchObject({
      data: [
        {
          id: seeded.firstFileId,
          commitId: seeded.firstCommitId,
          path: "codex-rs/core/src/prompt.rs",
          changeType: "modified",
        },
      ],
      nextCursor: null,
      returnedCount: 1,
      totalCount: 1,
      hasMore: false,
    });

    await classifyCommit(seeded.firstCommitId);
    await classifyFile(seeded.firstFileId);

    const commitDetail = await injectJson("GET", `/api/commits/${seeded.firstCommitId}`);
    expect(commitDetail).toMatchObject({
      id: seeded.firstCommitId,
      message: "Update prompt review behavior.\n\nBatch 05 API coverage target.",
      queuedFiles: [{ id: seeded.firstFileId, primaryTagSlug: tagSlug }],
      taggings: [{ tag: { slug: tagSlug }, kind: "primary" }],
    });

    const fileDetail = await injectJson("GET", `/api/commit-files/${seeded.firstFileId}`);
    expect(fileDetail).toMatchObject({
      id: seeded.firstFileId,
      primaryTagSlug: tagSlug,
      diffBlocks: [
        {
          id: seeded.diffBlockId,
          commitFileId: seeded.firstFileId,
          heading: "system prompt contract",
          oldStartLine: 10,
          oldEndLine: 12,
          newStartLine: 10,
          newEndLine: 13,
          patch: "@@ -10,3 +10,4 @@\n-old autonomy wording\n+new autonomy wording\n+explicit persistence wording",
        },
      ],
      review: {
        taggings: [{ tag: { slug: tagSlug }, kind: "primary" }],
      },
    });

    const missingFileDecisions = await injectJson(
      "GET",
      `/api/versions/${seeded.versionId}/missing-decisions?target=file`,
    );
    expect(missingFileDecisions).toMatchObject({
      target: "file",
      data: [{ id: seeded.firstFileId, path: "codex-rs/core/src/prompt.rs" }],
    });

    const missingCommitDecisions = await injectJson(
      "GET",
      `/api/versions/${seeded.versionId}/missing-decisions?target=commit`,
    );
    expect(missingCommitDecisions).toMatchObject({
      target: "commit",
      data: [{ id: seeded.firstCommitId, title: "Prompt API contract" }],
    });

    const remainingWork = await injectJson("GET", `/api/versions/${seeded.versionId}/remaining-work`);
    expect(remainingWork.remainingWork).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "classification",
          targetIds: [seeded.secondFileId],
          nextActions: [expect.objectContaining({ type: "classify", targetId: seeded.secondFileId })],
        }),
        expect.objectContaining({
          kind: "decision",
          targetIds: [seeded.firstFileId],
          nextActions: [expect.objectContaining({ type: "decide", targetId: seeded.firstFileId })],
        }),
      ]),
    );
  });

  it("runs comment, decision, and plan mutation flows through real services", async () => {
    await classifyFile(seeded.firstFileId);

    const comment = await injectJson("POST", "/api/comments", {
      scope: { type: "diff_block", diffBlockId: seeded.diffBlockId },
      anchor: { kind: "block", diffBlockId: seeded.diffBlockId },
      body: "Check whether this prompt wording changes continuation behavior.",
      author: agent,
    }, 201);
    expect(comment).toMatchObject({
      scope: { type: "diff_block", diffBlockId: seeded.diffBlockId },
      status: "open",
      anchor: { kind: "block", diffBlockId: seeded.diffBlockId },
    });

    const listed = await injectJson("GET", `/api/comments?commitFileId=${seeded.firstFileId}&status=open`);
    expect(listed.comments.map((item: { id: string }) => item.id)).toEqual([comment.id]);

    const resolved = await injectJson("PATCH", `/api/comments/${comment.id}/resolve`, {
      status: "resolved",
      resolution: "Reviewed the changed wording.",
      actor: human,
    });
    expect(resolved).toMatchObject({ id: comment.id, status: "resolved", resolvedBy: human });

    const reopened = await injectJson("PATCH", `/api/comments/${comment.id}/reopen`, {
      reason: "Need one more pass.",
      actor: human,
    });
    expect(reopened).toMatchObject({ id: comment.id, status: "open" });

    const decision = await injectJson("POST", "/api/decisions", {
      scope: { type: "commit_file", commitFileId: seeded.firstFileId },
      outcome: "accept_with_watch",
      rationale: "Intentional but worth tracking in downstream prompts.",
      proposedBy: agent,
      riskLevel: "medium",
      confidence: "high",
    }, 201);
    expect(decision).toMatchObject({
      scope: { type: "commit_file", commitFileId: seeded.firstFileId },
      status: "proposed",
      proposedBy: agent,
    });

    await expectStatus("POST", `/api/decisions/${decision.id}/finalize`, 403, {
      status: "accepted",
      finalizer: agent,
      rationale: "Agents cannot finalize decisions.",
    });

    const finalized = await injectJson("POST", `/api/decisions/${decision.id}/finalize`, {
      status: "accepted",
      finalizer: human,
      rationale: "Human accepted with watch.",
    });
    expect(finalized).toMatchObject({ id: decision.id, status: "accepted", finalizedBy: human });

    const plan = await injectJson("POST", "/api/plans", {
      scope: { type: "commit_file", commitFileId: seeded.firstFileId },
      title: "Follow-up review plan",
      summary: "Make sure the behavior survives prompt harness changes.",
      proposedBy: agent,
      commentIds: [comment.id],
      decisionIds: [decision.id],
      diffBlockIds: [seeded.diffBlockId],
    }, 201);
    expect(plan).toMatchObject({
      scope: { type: "commit_file", commitFileId: seeded.firstFileId },
      linkedCommentIds: [comment.id],
      linkedDecisionIds: [decision.id],
      linkedDiffBlockIds: [seeded.diffBlockId],
    });

    const item = await injectJson("POST", `/api/plans/${plan.id}/items`, {
      title: "Verify downstream prompt expectations",
      description: "Compare continuation behavior before accepting upstream.",
      commitFileId: seeded.firstFileId,
      decisionId: decision.id,
      actor: human,
    }, 201);
    expect(item).toMatchObject({ planId: plan.id, status: "todo", commitFileId: seeded.firstFileId });

    await expectStatus("POST", `/api/plans/${plan.id}/complete`, 409, {
      completedBy: human,
      completionNote: "Blocked by the unfinished item.",
    });

    const completedItem = await injectJson("PATCH", `/api/plan-items/${item.id}`, {
      status: "complete",
      actor: human,
    });
    expect(completedItem).toMatchObject({ id: item.id, status: "complete" });

    const completedPlan = await injectJson("POST", `/api/plans/${plan.id}/complete`, {
      completedBy: human,
      completionNote: "All follow-up review work is complete.",
    });
    expect(completedPlan).toMatchObject({
      id: plan.id,
      status: "complete",
      completedBy: human,
      completionNote: "All follow-up review work is complete.",
    });
  });

  it("returns validation and not-found errors from DB-backed routes", async () => {
    await expectStatus("POST", "/api/comments", 400, {
      scope: { type: "commit_file", commitFileId: seeded.firstFileId },
      anchor: { kind: "block", diffBlockId: seeded.diffBlockId },
      body: "Anchor does not match scope.",
      author: agent,
    });

    await expectStatus("GET", "/api/commits/unknown-commit", 404);
  });

  it("keeps API routes out of database and row-schema imports", () => {
    const apiDirectory = path.dirname(fileURLToPath(import.meta.url));
    const routeDirectory = path.join(apiDirectory, "routes");
    const apiFiles = [
      path.join(apiDirectory, "app.ts"),
      ...readdirSync(routeDirectory)
        .filter((entry) => entry.endsWith(".ts"))
        .map((entry) => path.join(routeDirectory, entry)),
    ];

    for (const file of apiFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(apiDirectory, file)).not.toMatch(
        /from\s+["'][^"']*(?:\/db\/|\/repositories\/|rowSchemas)[^"']*["']/,
      );
    }
  });
});

function seedReview(db: TempPromptReviewsDatabase): SeededReview {
  const versionId = "ver_batch_05";
  const closedVersionId = "ver_closed";
  const firstCommitId = "cmt_prompt_api";
  const secondCommitId = "cmt_prompt_followup";
  const firstFileId = "file_prompt_contract";
  const secondFileId = "file_prompt_followup";
  const diffBlockId = "blk_prompt_contract";

  createVersion(db.db, {
    id: versionId,
    repositoryId: "codex",
    label: "Batch 05 DB review",
    baseSha: "base-batch-05",
    targetSha: "target-batch-05",
    status: "open",
    description: "Temp DB API coverage.",
    createdAt: 200,
  });
  createVersion(db.db, {
    id: closedVersionId,
    repositoryId: "codex",
    label: "Closed review",
    baseSha: "base-closed",
    targetSha: "target-closed",
    status: "closed",
    createdAt: 100,
    closedAt: 150,
  });
  bulkInsertCommits(db.db, [
    {
      id: firstCommitId,
      versionId,
      sha: "a".repeat(40),
      parentSha: "b".repeat(40),
      ordinal: 1,
      title: "Prompt API contract",
      message: "Update prompt review behavior.\n\nBatch 05 API coverage target.",
      authorName: "Ada",
      authorEmail: "ada@example.test",
      committedAt: 201,
      createdAt: 201,
    },
    {
      id: secondCommitId,
      versionId,
      sha: "c".repeat(40),
      parentSha: "a".repeat(40),
      ordinal: 2,
      title: "Prompt follow-up",
      message: "Add follow-up prompt handling.",
      authorName: "Grace",
      authorEmail: "grace@example.test",
      committedAt: 202,
      createdAt: 202,
    },
  ]);
  bulkInsertCommitFiles(db.db, [
    {
      id: firstFileId,
      commitId: firstCommitId,
      oldPath: "codex-rs/core/src/prompt.rs",
      newPath: "codex-rs/core/src/prompt.rs",
      changeType: "modified",
      additions: 2,
      deletions: 1,
      createdAt: 210,
    },
    {
      id: secondFileId,
      commitId: secondCommitId,
      oldPath: "codex-rs/core/src/followup.rs",
      newPath: "codex-rs/core/src/followup.rs",
      changeType: "modified",
      additions: 1,
      deletions: 1,
      createdAt: 220,
    },
  ]);
  bulkInsertDiffBlocks(db.db, [
    {
      id: diffBlockId,
      commitFileId: firstFileId,
      blockKey: "prompt-contract",
      ordinal: 1,
      contentHash: "hash-prompt-contract",
      heading: "system prompt contract",
      oldStartLine: 10,
      oldEndLine: 12,
      newStartLine: 10,
      newEndLine: 13,
      patch: "@@ -10,3 +10,4 @@\n-old autonomy wording\n+new autonomy wording\n+explicit persistence wording",
      createdAt: 211,
    },
  ]);

  return {
    versionId,
    closedVersionId,
    firstCommitId,
    secondCommitId,
    firstFileId,
    secondFileId,
    diffBlockId,
  };
}

function createDbBackedContext(db: TempPromptReviewsDatabase): PromptReviewsApiContext {
  const serviceContext = createServiceContext({ db: db.db, now: () => 1_700_000_000 });
  return {
    versions: createVersionService(serviceContext, { gitClient: fakeGitClient }),
    classification: createClassificationService(serviceContext, { actor: agent }),
    status: createStatusService(serviceContext),
    queue: createReviewQueueService(serviceContext),
    comments: createCommentService(serviceContext),
    decisions: createDecisionService(serviceContext),
    plans: createPlanService(serviceContext),
    read: createReviewReadService(serviceContext),
  };
}

async function classifyCommit(commitId: string): Promise<void> {
  await injectJson("PATCH", `/api/commits/${commitId}/classification`, {
    primaryTagSlug: tagSlug,
    secondaryTagSlugs: [],
    rationale: "Prompt contract changed.",
    summary: "Commit affects prompt review behavior.",
    riskLevel: "medium",
    confidence: "high",
  });
}

async function classifyFile(commitFileId: string): Promise<void> {
  await injectJson("PATCH", `/api/commit-files/${commitFileId}/classification`, {
    primaryTagSlug: tagSlug,
    secondaryTagSlugs: [],
    rationale: "File contains changed prompt wording.",
    summary: "File needs human prompt review.",
    riskLevel: "medium",
    confidence: "high",
  });
}

async function injectJson(method: string, url: string, payload?: unknown, expectedStatus = 200): Promise<any> {
  const response = await inject(method, url, payload);
  expect(response.statusCode, `${method} ${url}: ${response.body}`).toBe(expectedStatus);
  return response.json();
}

async function expectStatus(method: string, url: string, statusCode: number, payload?: unknown): Promise<void> {
  const response = await inject(method, url, payload);
  expect(response.statusCode, `${method} ${url}: ${response.body}`).toBe(statusCode);
  expect(response.json()).toHaveProperty("error.code");
}

async function inject(method: string, url: string, payload?: unknown): Promise<LightMyRequestResponse> {
  if (app === undefined) {
    throw new Error("Expected API app to be initialized.");
  }
  return app.inject({ method, url, payload });
}

const fakeGitClient: GitClient = {
  resolveRef: async (refOrSha) => refOrSha,
  listCommits: async () => [],
  listChangedFiles: async () => [],
  getCommitDiff: async () => "",
};
