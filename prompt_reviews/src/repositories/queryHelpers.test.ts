import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  createDecision,
  createPlan,
  createPlanItem,
  createVersion,
  findCommitById,
  findCommitFileById,
  findConcernTagBySlug,
  listCommitFilesByVersion,
  listDecisionsByTarget,
  listPlansByTarget,
  listRemainingCommitFilesByVersion,
  seedConcernTagsRepository,
  updateDecision,
  updatePlan,
  type CommitFileRow,
} from "./index.js";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("repository query helpers", () => {
  it("finds commits/files and paginates remaining files at version scope", () => {
    const version = createVersion(database.db, {
      id: "ver_query",
      repositoryId: "codex",
      label: "query",
      baseSha: "base",
      targetSha: "target",
    });
    const [firstCommit, secondCommit] = bulkInsertCommits(database.db, [
      { id: "cmt_first", versionId: version.id, sha: "sha-1", ordinal: 1, title: "First" },
      { id: "cmt_second", versionId: version.id, sha: "sha-2", ordinal: 2, title: "Second" },
    ]);
    const files = bulkInsertCommitFiles(database.db, [
      makeFile("file_one", firstCommit.id, 100),
      makeFile("file_two", secondCommit.id, 101),
      makeFile("file_done", secondCommit.id, 102, "accepted"),
    ]);

    expect(findCommitById(database.db, secondCommit.id)).toEqual(secondCommit);
    expect(findCommitFileById(database.db, files[0].id)).toEqual(files[0]);
    expect(listCommitFilesByVersion(database.db, version.id).map((row) => row.id)).toEqual([
      "file_one",
      "file_two",
      "file_done",
    ]);
    expect(listRemainingCommitFilesByVersion(database.db, version.id, { limit: 1 }).items).toEqual([files[0]]);
  });

  it("lists decisions and plans by exact workflow target", () => {
    const file = seedFile();
    const decision = createDecision(database.db, {
      id: "dec_target",
      scope: "commit_file",
      commitFileId: file.id,
      outcome: "accept",
      rationale: "Looks good.",
      proposedByActorType: "human",
    });
    const acceptedDecision = updateDecision(database.db, decision.id, {
      status: "accepted",
      finalizedByActorType: "human",
      finalizedAt: 100,
    });
    const plan = createPlan(database.db, {
      id: "pln_target",
      scope: "commit_file",
      commitFileId: file.id,
      title: "Follow-up",
      status: "accepted",
      proposedByActorType: "agent",
    });
    createPlanItem(database.db, {
      id: "pli_target",
      planId: plan.id,
      ordinal: 1,
      title: "Patch",
      status: "todo",
    });
    const acceptedPlan = updatePlan(database.db, plan.id, { status: "accepted" });

    expect(
      listDecisionsByTarget(database.db, { scope: "commit_file", targetId: file.id }, ["accepted"]),
    ).toEqual([acceptedDecision]);
    expect(listPlansByTarget(database.db, { scope: "commit_file", targetId: file.id }, { status: "accepted" })).toEqual(
      [acceptedPlan],
    );
  });
});

function makeFile(
  id: string,
  commitId: string,
  createdAt: number,
  reviewStatus: CommitFileRow["reviewStatus"] = "needs_decision",
) {
  return {
    id,
    commitId,
    oldPath: `src/${id}.ts`,
    newPath: `src/${id}.ts`,
    changeType: "modified" as const,
    reviewStatus,
    createdAt,
  };
}

function seedFile(): CommitFileRow {
  seedConcernTagsRepository(database.db);
  const version = createVersion(database.db, {
    id: "ver_target",
    repositoryId: "codex",
    label: "target",
    baseSha: "base-target",
    targetSha: "target-target",
  });
  const [commit] = bulkInsertCommits(database.db, [
    { id: "cmt_target", versionId: version.id, sha: "sha-target", ordinal: 1, title: "Target" },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [makeFile("file_target", commit.id, 100)]);
  const tag = findConcernTagBySlug(database.db, "goal.initial-steering");
  if (tag === undefined) {
    throw new Error("Expected seeded tag.");
  }
  addTagging(database.db, {
    id: "tgg_target",
    tagId: tag.id,
    targetType: "commit_file",
    targetId: file.id,
    kind: "primary",
    createdByActorType: "human",
  });
  return file;
}
