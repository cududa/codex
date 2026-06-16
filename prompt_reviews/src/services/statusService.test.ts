import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DecisionOutcome, ReviewStatus } from "../domain/enums.js";
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
  findCommitById,
  findConcernTagBySlug,
  seedConcernTagsRepository,
  updateVersionStatus,
  type CommitFileRow,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import { createServiceContext, type ServiceContext } from "./serviceContext.js";
import { createStatusService } from "./statusService.js";

let database: TempPromptReviewsDatabase;
let context: ServiceContext;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  context = createServiceContext({ db: database.db, now: () => 1_000 });
});

afterEach(() => {
  database.cleanup();
});

describe("status service", () => {
  it("derives file statuses from classification, accepted human decisions, and unresolved work gates", () => {
    const file = seedFile("file_status");
    const service = createStatusService(context);

    expect(service.recomputeFileStatus(file.id)).toEqual({ id: file.id, status: "needs_classification" });

    tagFile(file.id);
    expect(service.recomputeFileStatus(file.id)).toEqual({ id: file.id, status: "needs_decision" });

    acceptFile(file.id, "accept");
    expect(service.recomputeFileStatus(file.id)).toEqual({ id: file.id, status: "accepted" });

    addComment(database.db, {
      id: "com_blocking",
      scope: "commit_file",
      commitFileId: file.id,
      body: "Still unresolved.",
      status: "open",
      authorActorType: "agent",
    });
    expect(service.recomputeFileStatus(file.id)).toEqual({ id: file.id, status: "blocked" });
  });

  it.each([
    ["accept_with_watch", "accepted_with_watch"],
    ["patch_required", "patch_required"],
    ["reject_for_local_build", "rejected"],
    ["blocked_on_context", "blocked"],
  ] satisfies Array<[DecisionOutcome, ReviewStatus]>)("maps accepted %s decisions to %s", (outcome, status) => {
    const file = seedClassifiedFile(`file_${outcome}`);
    acceptFile(file.id, outcome);

    expect(createStatusService(context).recomputeFileStatus(file.id)).toEqual({ id: file.id, status });
  });

  it("blocks accepted status when accepted plans have incomplete items", () => {
    const file = seedClassifiedFile("file_plan_blocker");
    acceptFile(file.id, "accept");
    const plan = createPlan(database.db, {
      id: "pln_file_blocker",
      scope: "commit_file",
      commitFileId: file.id,
      title: "Patch plan",
      status: "accepted",
      proposedByActorType: "human",
    });
    createPlanItem(database.db, {
      id: "pli_file_blocker",
      planId: plan.id,
      ordinal: 1,
      title: "Patch",
      status: "todo",
    });

    expect(createStatusService(context).recomputeFileStatus(file.id)).toEqual({ id: file.id, status: "blocked" });
  });

  it("updates commit status from the strictest child file status", () => {
    const commit = seedCommit("cmt_precedence");
    const [accepted, patchRequired] = seedFiles(commit.id, ["file_accepted", "file_patch"]);
    tagFile(accepted.id);
    tagFile(patchRequired.id);
    acceptFile(accepted.id, "accept");
    acceptFile(patchRequired.id, "patch_required");

    const service = createStatusService(context);

    expect(service.recomputeCommitStatus(commit.id)).toEqual({ id: commit.id, status: "patch_required" });
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("patch_required");
  });

  it("derives version readiness, preserves closed status, and blocks ready on commit-scoped incomplete plans", () => {
    const commit = seedCommit("cmt_version_ready");
    const [file] = seedFiles(commit.id, ["file_version_ready"]);
    tagFile(file.id);
    acceptFile(file.id, "accept");
    const service = createStatusService(context);

    expect(service.recomputeVersionStatus(commit.versionId)).toEqual({ id: commit.versionId, status: "ready" });

    const plan = createPlan(database.db, {
      id: "pln_commit_blocker",
      scope: "commit",
      commitId: commit.id,
      title: "Commit follow-up",
      status: "accepted",
      proposedByActorType: "human",
    });
    createPlanItem(database.db, {
      id: "pli_commit_blocker",
      planId: plan.id,
      ordinal: 1,
      title: "Run focused check",
      status: "todo",
    });

    expect(service.recomputeVersionStatus(commit.versionId)).toEqual({ id: commit.versionId, status: "reviewing" });

    updateVersionStatus(database.db, commit.versionId, {
      status: "closed",
      closedAt: 1_001,
      closedByActorType: "human",
      closedByActorId: "reviewer",
    });
    expect(service.recomputeVersionStatus(commit.versionId)).toEqual({ id: commit.versionId, status: "closed" });
  });
});

function seedVersion(id = "ver_status"): VersionRow {
  return createVersion(database.db, {
    id,
    repositoryId: "codex",
    label: id,
    baseSha: `base-${id}`,
    targetSha: `target-${id}`,
  });
}

function seedCommit(id = "cmt_status"): CommitRow {
  const version = seedVersion(`ver_${id}`);
  const [commit] = bulkInsertCommits(database.db, [
    {
      id,
      versionId: version.id,
      sha: `sha-${id}`,
      ordinal: 1,
      title: id,
    },
  ]);
  return commit;
}

function seedFile(id: string): CommitFileRow {
  const commit = seedCommit(`cmt_${id}`);
  return seedFiles(commit.id, [id])[0];
}

function seedClassifiedFile(id: string): CommitFileRow {
  const file = seedFile(id);
  tagFile(file.id);
  return file;
}

function seedFiles(commitId: string, ids: string[]): CommitFileRow[] {
  return bulkInsertCommitFiles(
    database.db,
    ids.map((id, index) => ({
      id,
      commitId,
      oldPath: `src/${id}.ts`,
      newPath: `src/${id}.ts`,
      changeType: "modified" as const,
      createdAt: 100 + index,
    })),
  );
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

function acceptFile(fileId: string, outcome: DecisionOutcome): void {
  const decision = createDecision(database.db, {
    id: `dec_${fileId}_${outcome}`,
    scope: "commit_file",
    commitFileId: fileId,
    status: "accepted",
    outcome,
    rationale: "Human-final decision.",
    proposedByActorType: "human",
    finalizedByActorType: "human",
    finalizedAt: 900,
  });
  if (decision.status !== "accepted") {
    throw new Error("Expected accepted decision.");
  }
}
