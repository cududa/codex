import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addComment,
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  createDecision,
  createPlan,
  createPlanItem,
  createVersion,
  findConcernTagBySlug,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
} from "../repositories/index.js";
import { createReviewQueueService } from "./reviewQueueService.js";
import { createServiceContext, type ServiceContext } from "./serviceContext.js";

let database: TempPromptReviewsDatabase;
let context: ServiceContext;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  context = createServiceContext({ db: database.db, now: () => 2_000 });
});

afterEach(() => {
  database.cleanup();
});

describe("review queue service", () => {
  it("lists remaining commits and files as domain queue items", () => {
    const { versionId, commit, allFiles } = seedQueue();
    const service = createReviewQueueService(context);

    expect(service.listRemainingCommits({ versionId })).toEqual({
      data: [
        {
          id: commit.id,
          versionId,
          sha: commit.sha,
          title: commit.title,
          authorName: undefined,
          committedAt: undefined,
          status: "unreviewed",
          primaryTagSlug: undefined,
          secondaryTagSlugs: [],
          fileCount: allFiles.length,
        },
      ],
      nextCursor: null,
      returnedCount: 1,
      totalCount: 1,
      hasMore: false,
    });
    expect(service.listRemainingFiles({ versionId })).toMatchObject({
      data: allFiles.map((file) => expect.objectContaining({ id: file.id })),
      nextCursor: null,
      returnedCount: allFiles.length,
      totalCount: allFiles.length,
      hasMore: false,
    });

    const firstFilePage = service.listRemainingFiles({ commitId: commit.id, limit: 1 });
    expect(firstFilePage).toMatchObject({
      data: [expect.objectContaining({ id: allFiles[0].id })],
      returnedCount: 1,
      totalCount: allFiles.length,
      hasMore: true,
    });

    const secondFilePage = service.listRemainingFiles({ commitId: commit.id, cursor: firstFilePage.nextCursor, limit: 1 });
    expect(secondFilePage).toMatchObject({
      data: [expect.objectContaining({ id: allFiles[1].id })],
      returnedCount: 1,
      totalCount: allFiles.length,
      hasMore: true,
    });
  });

  it("reports missing decisions, open comments, open plans, and remaining-work groups", () => {
    const { versionId, files, planId } = seedQueue();
    const service = createReviewQueueService(context);

    expect(service.listMissingDecisions({ versionId }).map((file) => file.id)).toEqual(["file_missing_decision"]);
    expect(service.listOpenComments({ versionId }).map((comment) => comment.id)).toEqual(["com_open"]);
    expect(service.listOpenPlans({ versionId }).map((plan) => plan.id)).toEqual([planId]);

    const remainingWork = service.getRemainingWork({ versionId });

    expect(remainingWork.map((work) => work.kind)).toEqual(["classification", "decision", "comment", "plan"]);
    expect(remainingWork.find((work) => work.kind === "classification")?.targetIds).toEqual([
      files.unclassified.id,
    ]);
    expect(remainingWork.find((work) => work.kind === "decision")?.targetIds).toEqual([files.missingDecision.id]);
    expect(remainingWork.find((work) => work.kind === "comment")?.blockingComments.map((comment) => comment.id)).toEqual([
      "com_open",
    ]);
    expect(remainingWork.find((work) => work.kind === "plan")?.nextActions).toEqual([
      {
        type: "plan",
        label: "Blocked item",
        targetId: "pli_blocked",
        reason: "Waiting on context.",
      },
    ]);
  });
});

function seedQueue(): {
  versionId: string;
  commit: CommitRow;
  allFiles: CommitFileRow[];
  planId: string;
  files: {
    unclassified: CommitFileRow;
    missingDecision: CommitFileRow;
    commented: CommitFileRow;
    planned: CommitFileRow;
  };
} {
  const version = createVersion(database.db, {
    id: "ver_queue",
    repositoryId: "codex",
    label: "queue",
    baseSha: "base-queue",
    targetSha: "target-queue",
  });
  const [commit] = bulkInsertCommits(database.db, [
    { id: "cmt_queue", versionId: version.id, sha: "sha-queue", ordinal: 1, title: "Queue" },
  ]);
  const files = bulkInsertCommitFiles(database.db, [
    makeFile("file_unclassified", commit.id, 100),
    makeFile("file_missing_decision", commit.id, 101),
    makeFile("file_commented", commit.id, 102),
    makeFile("file_planned", commit.id, 103),
  ]);
  const [unclassified, missingDecision, commented, planned] = files;
  tagFile(missingDecision.id);
  tagFile(commented.id);
  tagFile(planned.id);
  acceptFile(commented.id);
  acceptFile(planned.id);
  addComment(database.db, {
    id: "com_open",
    scope: "commit_file",
    commitFileId: commented.id,
    body: "Needs resolution.",
    status: "open",
    authorActorType: "agent",
  });
  const plan = createPlan(database.db, {
    id: "pln_open",
    scope: "commit_file",
    commitFileId: planned.id,
    title: "Accepted plan",
    status: "accepted",
    proposedByActorType: "human",
  });
  createPlanItem(database.db, {
    id: "pli_blocked",
    planId: plan.id,
    ordinal: 1,
    title: "Blocked item",
    status: "blocked",
    blockingReason: "Waiting on context.",
  });

  return {
    versionId: version.id,
    commit,
    allFiles: files,
    planId: plan.id,
    files: { unclassified, missingDecision, commented, planned },
  };
}

function makeFile(id: string, commitId: string, createdAt: number) {
  return {
    id,
    commitId,
    oldPath: `src/${id}.ts`,
    newPath: `src/${id}.ts`,
    changeType: "modified" as const,
    createdAt,
  };
}

function tagFile(fileId: string): void {
  seedConcernTagsRepository(database.db);
  const tag = findConcernTagBySlug(database.db, "goal.initial-steering");
  if (tag === undefined) {
    throw new Error("Expected seeded concern tag.");
  }
  addTagging(database.db, {
    id: `tgg_${fileId}`,
    tagId: tag.id,
    targetType: "commit_file",
    targetId: fileId,
    kind: "primary",
    createdByActorType: "human",
  });
}

function acceptFile(fileId: string): void {
  createDecision(database.db, {
    id: `dec_${fileId}`,
    scope: "commit_file",
    commitFileId: fileId,
    status: "accepted",
    outcome: "accept",
    rationale: "Accepted.",
    proposedByActorType: "human",
    finalizedByActorType: "human",
    finalizedAt: 900,
  });
}
