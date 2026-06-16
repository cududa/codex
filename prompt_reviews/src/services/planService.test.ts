import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addComment,
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createDecision,
  createVersion,
  findCommitById,
  findCommitFileById,
  findConcernTagBySlug,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
} from "../repositories/index.js";
import { createPlanService } from "./planService.js";
import { createReviewQueueService } from "./reviewQueueService.js";
import { createServiceContext, type RootServiceContext } from "./serviceContext.js";
import { createStatusService } from "./statusService.js";

let database: TempPromptReviewsDatabase;
let context: RootServiceContext;
let now: number;

const agent = { type: "agent", id: "agent-1", displayName: "Agent One" } as const;
const human = { type: "human", id: "reviewer", displayName: "Reviewer" } as const;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  seedConcernTagsRepository(database.db);
  now = 9_000;
  context = createServiceContext({ db: database.db, now: () => now });
});

afterEach(() => {
  database.cleanup();
});

describe("plan service", () => {
  it("creates, updates, and completes plans and plan items", () => {
    const { file } = seedReviewTarget("plan_lifecycle");
    const service = createPlanService(context);

    const created = service.createPlan({
      scope: { type: "commit_file", commitFileId: file.id },
      title: "Patch prompt wording",
      summary: "Make the wording less brittle.",
      proposedBy: agent,
    });
    expect(created).toEqual({
      id: created.id,
      scope: { type: "commit_file", commitFileId: file.id },
      title: "Patch prompt wording",
      summary: "Make the wording less brittle.",
      status: "proposed",
      proposedBy: agent,
      createdAt: 9_000,
      completedAt: undefined,
      items: [],
      linkedCommentIds: [],
      linkedDecisionIds: [],
      linkedDiffBlockIds: [],
      updatedAt: 9_000,
      completedBy: undefined,
      completionNote: undefined,
    });

    now = 9_001;
    const accepted = service.updatePlan({
      planId: created.id,
      title: "Patch steering wording",
      status: "accepted",
      actor: human,
    });
    expect(accepted).toEqual({
      ...created,
      title: "Patch steering wording",
      status: "accepted",
      updatedAt: 9_001,
    });

    now = 9_002;
    const item = service.createPlanItem({
      planId: created.id,
      title: "Edit service prompt",
      description: "Tighten the instruction.",
      actor: agent,
    });
    expect(item).toEqual({
      id: item.id,
      planId: created.id,
      title: "Edit service prompt",
      description: "Tighten the instruction.",
      status: "todo",
      blockingReason: undefined,
      commitFileId: undefined,
      decisionId: undefined,
      createdAt: 9_002,
      updatedAt: 9_002,
    });

    now = 9_003;
    const completedItem = service.updatePlanItem({
      planItemId: item.id,
      status: "complete",
      actor: human,
    });
    expect(completedItem).toEqual({ ...item, status: "complete", updatedAt: 9_003 });

    now = 9_004;
    const completed = service.completePlan({
      planId: created.id,
      completedBy: human,
      completionNote: "Applied in the follow-up patch.",
    });
    expect(completed).toEqual({
      ...accepted,
      status: "complete",
      completedAt: 9_004,
      items: [completedItem],
      updatedAt: 9_004,
      completedBy: human,
      completionNote: "Applied in the follow-up patch.",
    });
  });

  it("links plans to comments, decisions, and diff blocks and plan items to files and decisions", () => {
    const { file } = seedAcceptedFile("plan_links");
    const [diffBlock] = bulkInsertDiffBlocks(database.db, [
      {
        id: "blk_plan_link",
        commitFileId: file.id,
        blockKey: "plan-link",
        ordinal: 1,
        contentHash: "hash-plan-link",
        patch: "@@ patch",
      },
    ]);
    const comment = addComment(database.db, {
      id: "com_plan_link",
      scope: "commit_file",
      commitFileId: file.id,
      body: "Track this concern in the plan.",
      status: "open",
      authorActorType: "agent",
    });
    const decision = createDecision(database.db, {
      id: "dec_plan_link",
      scope: "commit_file",
      commitFileId: file.id,
      status: "accepted",
      outcome: "accept",
      rationale: "Accepted with linked plan evidence.",
      proposedByActorType: "human",
      finalizedByActorType: "human",
      finalizedAt: 8_901,
    });
    const service = createPlanService(context);

    const plan = service.createPlan({
      scope: { type: "commit_file", commitFileId: file.id },
      title: "Linked follow-up",
      proposedBy: agent,
      commentIds: [comment.id],
      decisionIds: [decision.id],
      diffBlockIds: [diffBlock.id],
    });
    const item = service.createPlanItem({
      planId: plan.id,
      title: "Patch linked file",
      actor: agent,
      commitFileId: file.id,
      decisionId: decision.id,
    });

    expect(plan.linkedCommentIds).toEqual([comment.id]);
    expect(plan.linkedDecisionIds).toEqual([decision.id]);
    expect(plan.linkedDiffBlockIds).toEqual([diffBlock.id]);
    expect(item).toMatchObject({
      commitFileId: file.id,
      decisionId: decision.id,
    });

    const cleared = service.updatePlan({
      planId: plan.id,
      commentIds: [],
      decisionIds: [],
      diffBlockIds: [],
      actor: human,
    });
    expect(cleared.linkedCommentIds).toEqual([]);
    expect(cleared.linkedDecisionIds).toEqual([]);
    expect(cleared.linkedDiffBlockIds).toEqual([]);
  });

  it("rejects unvalidated plan link ids", () => {
    const { file } = seedReviewTarget("plan_bad_links");
    const service = createPlanService(context);

    expect(() =>
      service.createPlan({
        scope: { type: "commit_file", commitFileId: file.id },
        title: "Bad link",
        proposedBy: agent,
        commentIds: ["com_missing"],
      }),
    ).toThrow();
    expect(() =>
      service.createPlan({
        scope: { type: "commit_file", commitFileId: file.id },
        title: "Bad block link",
        proposedBy: agent,
        diffBlockIds: ["blk_missing"],
      }),
    ).toThrow();
  });

  it("blocks accepted status on incomplete accepted plan items and clears remaining work when completed", () => {
    const { commit, file } = seedAcceptedFile("plan_blocking");
    const service = createPlanService(context);
    const queue = createReviewQueueService(context);
    expect(createStatusService(context).recomputeFileStatus(file.id).status).toBe("accepted");

    const plan = service.createPlan({
      scope: { type: "commit_file", commitFileId: file.id },
      title: "Follow-up plan",
      proposedBy: human,
    });
    service.updatePlan({ planId: plan.id, status: "accepted", actor: human });
    const item = service.createPlanItem({ planId: plan.id, title: "Finish follow-up", actor: agent });

    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("blocked");
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("blocked");
    expect(queue.getRemainingWork({ versionId: commit.versionId }).map((work) => work.kind)).toEqual(["plan"]);

    service.updatePlanItem({ planItemId: item.id, status: "complete", actor: human });

    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("accepted");
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("accepted");
    expect(queue.getRemainingWork({ versionId: commit.versionId }).map((work) => work.kind)).toEqual([
      "version_closure",
    ]);
  });
});

function seedReviewTarget(id: string): { commit: CommitRow; file: CommitFileRow } {
  const version = createVersion(database.db, {
    id: `ver_${id}`,
    repositoryId: "codex",
    label: id,
    baseSha: `base-${id}`,
    targetSha: `target-${id}`,
  });
  const [commit] = bulkInsertCommits(database.db, [
    { id: `cmt_${id}`, versionId: version.id, sha: `sha-${id}`, ordinal: 1, title: id },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: `file_${id}`,
      commitId: commit.id,
      oldPath: `src/${id}.ts`,
      newPath: `src/${id}.ts`,
      changeType: "modified",
      createdAt: 100,
    },
  ]);
  return { commit, file };
}

function seedAcceptedFile(id: string): { commit: CommitRow; file: CommitFileRow } {
  const { commit, file } = seedReviewTarget(id);
  tagFile(file.id);
  createDecision(database.db, {
    id: `dec_${id}`,
    scope: "commit_file",
    commitFileId: file.id,
    status: "accepted",
    outcome: "accept",
    rationale: "Accepted.",
    proposedByActorType: "human",
    finalizedByActorType: "human",
    finalizedAt: 8_900,
  });
  return { commit, file };
}

function tagFile(fileId: string): void {
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
