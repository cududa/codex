import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addComment,
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createDecision,
  createPlan,
  createPlanItem,
  createVersion,
  deletePlanItem,
  findActiveDecisionByTarget,
  findConcernTagById,
  findConcernTagBySlug,
  findDiffBlockById,
  findLastClosedTarget,
  findVersionById,
  findVersionByRange,
  listCommitFilesByCommit,
  listCommitFilesMissingActiveDecision,
  listCommitsByVersion,
  listCommitsMissingActiveDecision,
  listConcernTagTree,
  listCommentsByScopeStatus,
  listDiffBlocksByCommitFile,
  listIncompleteAcceptedPlanItemsByTarget,
  listPlanItems,
  listPlans,
  listPrimaryTaggingsByTarget,
  listRemainingCommitFilesByCommit,
  listRemainingCommitsByVersion,
  listTaggingsByTarget,
  listVersionsByStatus,
  listVersionsMissingActiveDecision,
  removeTagging,
  seedConcernTagsRepository,
  updateCommentLifecycleFields,
  updateCommitFileReviewFields,
  updateCommitReviewFields,
  updateDecision,
  updatePlan,
  updatePlanItem,
  updateVersionStatus,
  withRepositoryTransaction,
  type CommitFileRow,
  type CommitRow,
  type ConcernTagRow,
  type DiffBlockInsert,
  type DiffBlockRow,
  type VersionRow,
} from "./index.js";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("version repository", () => {
  it("creates, finds, lists, updates, and locates the last closed target", () => {
    const version = insertVersion({ id: "ver_one", label: "one", targetSha: "target-a", createdAt: 100 });
    insertVersion({ id: "ver_two", label: "two", targetSha: "target-b", createdAt: 101 });

    expect(findVersionById(database.db, version.id)).toEqual(version);
    expect(findVersionByRange(database.db, { baseSha: "base-ver_one", targetSha: "target-a" })).toEqual(version);
    expect(listVersionsByStatus(database.db, "open").map((row) => row.id)).toEqual(["ver_two", "ver_one"]);

    const closed = updateVersionStatus(database.db, version.id, {
      status: "closed",
      closedAt: 200,
      closedByActorType: "human",
      closedByActorId: "reviewer",
      closedByDisplayName: "Reviewer",
      closureSummary: "Closed after review.",
      updatedAt: 201,
    });

    expect(closed).toMatchObject({ id: version.id, status: "closed", closedAt: 200, updatedAt: 201 });
    expect(findLastClosedTarget(database.db, { repositoryId: "codex", targetSha: "target-a" })?.id).toBe(version.id);
  });
});

describe("commit and file repositories", () => {
  it("round trips commits and updates review fields", () => {
    const version = insertVersion();
    const commits = insertCommits(version.id, 3);

    expect(listCommitsByVersion(database.db, version.id)).toEqual(commits);
    expect(listRemainingCommitsByVersion(database.db, version.id, { limit: 10 }).items).toEqual(commits);

    const updated = updateCommitReviewFields(database.db, commits[0].id, {
      reviewStatus: "accepted",
      updatedAt: 300,
    });

    expect(updated).toMatchObject({ id: commits[0].id, reviewStatus: "accepted", updatedAt: 300 });
    expect(listRemainingCommitsByVersion(database.db, version.id).items.map((row) => row.id)).toEqual([
      commits[1].id,
      commits[2].id,
    ]);
  });

  it("uses stable cursor pagination for remaining commits", () => {
    const version = insertVersion();
    const commits = insertCommits(version.id, 5);

    const firstPage = listRemainingCommitsByVersion(database.db, version.id, { limit: 2 });
    insertCommits(version.id, 1, { firstOrdinal: 0, idPrefix: "cmt_inserted" });
    const secondPage = listRemainingCommitsByVersion(database.db, version.id, {
      cursor: firstPage.nextCursor,
      limit: 2,
    });
    const thirdPage = listRemainingCommitsByVersion(database.db, version.id, {
      cursor: secondPage.nextCursor,
      limit: 2,
    });

    expect(firstPage.items.map((row) => row.id)).toEqual([commits[0].id, commits[1].id]);
    expect(secondPage.items.map((row) => row.id)).toEqual([commits[2].id, commits[3].id]);
    expect(thirdPage.items.map((row) => row.id)).toEqual([commits[4].id]);
    expect(thirdPage.nextCursor).toBeNull();
  });

  it("round trips commit files and updates review fields", () => {
    const commit = seedCommit();
    const files = insertCommitFiles(commit.id, [
      { id: "file_one", oldPath: "src/one.ts", newPath: "src/one.ts", createdAt: 100 },
      { id: "file_two", oldPath: null, newPath: "src/two.ts", createdAt: 101 },
    ]);

    expect(listCommitFilesByCommit(database.db, commit.id)).toEqual(files);
    expect(listRemainingCommitFilesByCommit(database.db, commit.id, { limit: 10 }).items).toEqual(files);

    const updated = updateCommitFileReviewFields(database.db, files[0].id, {
      reviewStatus: "needs_decision",
      updatedAt: 400,
    });

    expect(updated).toMatchObject({ id: files[0].id, reviewStatus: "needs_decision", updatedAt: 400 });
  });

  it("uses stable cursor pagination for remaining commit files", () => {
    const commit = seedCommit();
    const files = insertCommitFiles(commit.id, [
      { id: "file_1", oldPath: "src/1.ts", newPath: "src/1.ts", createdAt: 100 },
      { id: "file_2", oldPath: "src/2.ts", newPath: "src/2.ts", createdAt: 100 },
      { id: "file_3", oldPath: "src/3.ts", newPath: "src/3.ts", createdAt: 101 },
      { id: "file_4", oldPath: "src/4.ts", newPath: "src/4.ts", createdAt: 102 },
      { id: "file_5", oldPath: "src/5.ts", newPath: "src/5.ts", createdAt: 103 },
    ]);

    const firstPage = listRemainingCommitFilesByCommit(database.db, commit.id, { limit: 2 });
    insertCommitFiles(commit.id, [{ id: "file_inserted", oldPath: null, newPath: "src/0.ts", createdAt: 99 }]);
    const secondPage = listRemainingCommitFilesByCommit(database.db, commit.id, {
      cursor: firstPage.nextCursor,
      limit: 2,
    });
    const thirdPage = listRemainingCommitFilesByCommit(database.db, commit.id, {
      cursor: secondPage.nextCursor,
      limit: 2,
    });

    expect(firstPage.items.map((row) => row.id)).toEqual([files[0].id, files[1].id]);
    expect(secondPage.items.map((row) => row.id)).toEqual([files[2].id, files[3].id]);
    expect(thirdPage.items.map((row) => row.id)).toEqual([files[4].id]);
    expect(thirdPage.nextCursor).toBeNull();
  });
});

describe("diff block and concern tag repositories", () => {
  it("round trips diff blocks by file and id", () => {
    const file = seedCommitFile();
    const blocks = bulkInsertDiffBlocks(database.db, [
      makeDiffBlock(file.id, 1),
      makeDiffBlock(file.id, 2),
    ]);

    expect(listDiffBlocksByCommitFile(database.db, file.id)).toEqual(blocks);
    expect(findDiffBlockById(database.db, blocks[1].id)).toEqual(blocks[1]);
  });

  it("seeds concern tags and lists them as a tree", () => {
    seedConcernTagsRepository(database.db);
    seedConcernTagsRepository(database.db);

    const root = findConcernTagBySlug(database.db, "goal-steering-contract");
    const child = findConcernTagBySlug(database.db, "goal.initial-steering");
    if (root === undefined || child === undefined) {
      throw new Error("Expected seeded concern tags.");
    }

    const tree = listConcernTagTree(database.db);
    const treeRoot = tree.find((node) => node.id === root.id);

    expect(findConcernTagById(database.db, child.id)).toEqual(child);
    expect(treeRoot?.children.some((node) => node.id === child.id)).toBe(true);
  });
});

describe("tagging and comment repositories", () => {
  it("adds, updates, lists, and removes taggings", () => {
    const file = seedCommitFile();
    const tag = seedTag();

    const primary = addTagging(database.db, {
      id: "tgg_primary",
      tagId: tag.id,
      targetType: "commit_file",
      targetId: file.id,
      kind: "primary",
      rationale: "Primary concern.",
      createdByActorType: "human",
    });
    const updated = addTagging(database.db, {
      id: "tgg_primary_reused",
      tagId: tag.id,
      targetType: "commit_file",
      targetId: file.id,
      kind: "secondary",
      rationale: "Downgraded.",
      createdByActorType: "agent",
    });

    expect(primary.id).toBe("tgg_primary");
    expect(updated).toMatchObject({ id: "tgg_primary", kind: "secondary", rationale: "Downgraded." });
    expect(listTaggingsByTarget(database.db, { targetType: "commit_file", targetId: file.id })).toEqual([updated]);
    expect(listPrimaryTaggingsByTarget(database.db, { targetType: "commit_file", targetId: file.id })).toEqual([]);
    expect(removeTagging(database.db, updated)).toEqual([updated]);
  });

  it("adds comments, lists by scope/status, and updates lifecycle fields", () => {
    const block = seedDiffBlock();
    const open = addComment(database.db, {
      id: "com_open",
      scope: "diff_block",
      diffBlockId: block.id,
      body: "Needs attention.",
      status: "open",
      authorActorType: "agent",
    });
    addComment(database.db, {
      id: "com_file",
      scope: "commit_file",
      commitFileId: block.commitFileId,
      body: "File note.",
      status: "open",
      authorActorType: "human",
    });

    expect(
      listCommentsByScopeStatus(database.db, {
        scope: "diff_block",
        status: ["open", "resolved"],
        targetId: block.id,
      }),
    ).toEqual([open]);

    const resolved = updateCommentLifecycleFields(database.db, open.id, {
      status: "resolved",
      resolution: "Handled.",
      resolvedByActorType: "human",
      resolvedAt: 500,
      updatedAt: 501,
    });

    expect(resolved).toMatchObject({
      id: open.id,
      status: "resolved",
      resolution: "Handled.",
      resolvedAt: 500,
      updatedAt: 501,
    });
    expect(listCommentsByScopeStatus(database.db, { scope: "diff_block", status: "open" })).toEqual([]);
  });
});

describe("decision and plan repositories", () => {
  it("creates, updates, finds active decisions, and lists targets missing active decisions", () => {
    const version = insertVersion();
    const [commitOne, commitTwo] = insertCommits(version.id, 2);
    const [fileOne, fileTwo] = insertCommitFiles(commitOne.id, [
      { id: "file_decided", oldPath: "src/a.ts", newPath: "src/a.ts", createdAt: 100 },
      { id: "file_missing", oldPath: "src/b.ts", newPath: "src/b.ts", createdAt: 101 },
    ]);

    const decision = createDecision(database.db, {
      id: "dec_file",
      scope: "commit_file",
      commitFileId: fileOne.id,
      outcome: "needs_tests",
      rationale: "Needs targeted tests.",
      proposedByActorType: "agent",
    });
    const accepted = updateDecision(database.db, decision.id, {
      status: "accepted",
      finalizedByActorType: "human",
      riskLevel: "medium",
      confidence: "high",
      finalizedAt: 600,
      updatedAt: 601,
    });

    expect(findActiveDecisionByTarget(database.db, { scope: "commit_file", targetId: fileOne.id })).toBeUndefined();
    expect(accepted).toMatchObject({ id: decision.id, status: "accepted", riskLevel: "medium" });
    expect(listCommitFilesMissingActiveDecision(database.db, { commitId: commitOne.id }).map((row) => row.id)).toEqual([
      fileOne.id,
      fileTwo.id,
    ]);

    createDecision(database.db, {
      id: "dec_commit",
      scope: "commit",
      commitId: commitOne.id,
      outcome: "accept",
      rationale: "Commit is covered.",
      proposedByActorType: "human",
    });
    createDecision(database.db, {
      id: "dec_version",
      scope: "version",
      versionId: version.id,
      outcome: "accept",
      rationale: "Version is covered.",
      proposedByActorType: "human",
    });

    expect(findActiveDecisionByTarget(database.db, { scope: "commit", targetId: commitOne.id })?.id).toBe("dec_commit");
    expect(listCommitsMissingActiveDecision(database.db, { versionId: version.id }).map((row) => row.id)).toEqual([
      commitTwo.id,
    ]);
    expect(listVersionsMissingActiveDecision(database.db, { repositoryId: "codex" })).toEqual([]);
  });

  it("creates, updates, lists, and deletes plans and plan items", () => {
    const file = seedCommitFile();
    const plan = createPlan(database.db, {
      id: "pln_one",
      scope: "commit_file",
      commitFileId: file.id,
      title: "Patch plan",
      summary: "Make a focused fix.",
      status: "draft",
      proposedByActorType: "agent",
    });
    const updatedPlan = updatePlan(database.db, plan.id, {
      status: "accepted",
      summary: "Accepted focused fix.",
      updatedAt: 700,
    });
    const firstItem = createPlanItem(database.db, {
      id: "pli_one",
      planId: plan.id,
      ordinal: 1,
      title: "Patch code",
      status: "todo",
      commitFileId: file.id,
    });
    const secondItem = createPlanItem(database.db, {
      id: "pli_two",
      planId: plan.id,
      ordinal: 2,
      title: "Add test",
      status: "complete",
    });

    expect(updatedPlan).toMatchObject({ id: plan.id, status: "accepted", updatedAt: 700 });
    expect(listPlans(database.db, { scope: "commit_file", status: "accepted" })).toEqual([updatedPlan]);
    expect(listPlanItems(database.db, plan.id)).toEqual([firstItem, secondItem]);
    expect(listIncompleteAcceptedPlanItemsByTarget(database.db, { scope: "commit_file", targetId: file.id })).toEqual([
      { plan: updatedPlan, item: firstItem },
    ]);

    const blocked = updatePlanItem(database.db, firstItem.id, {
      status: "blocked",
      blockingReason: "Waiting on context.",
      updatedAt: 701,
    });
    expect(blocked).toMatchObject({ id: firstItem.id, status: "blocked", blockingReason: "Waiting on context." });
    expect(deletePlanItem(database.db, secondItem.id)).toEqual([secondItem]);
    expect(listPlanItems(database.db, plan.id).map((row) => row.id)).toEqual([firstItem.id]);
  });
});

describe("repository transactions", () => {
  it("rolls back repository writes on failure", () => {
    expect(() => {
      withRepositoryTransaction(database.db, (tx) => {
        createVersion(tx, {
          id: "ver_rollback",
          repositoryId: "codex",
          label: "rollback",
          baseSha: "base-rollback",
          targetSha: "target-rollback",
        });
        throw new Error("rollback");
      });
    }).toThrow("rollback");

    expect(findVersionById(database.db, "ver_rollback")).toBeUndefined();
  });
});

function insertVersion(values: Partial<VersionRow> = {}): VersionRow {
  const id = values.id ?? "ver_main";
  return createVersion(database.db, {
    id,
    repositoryId: values.repositoryId ?? "codex",
    label: values.label ?? id,
    baseSha: values.baseSha ?? `base-${id}`,
    targetSha: values.targetSha ?? `target-${id}`,
    status: values.status ?? "open",
    description: values.description,
    createdAt: values.createdAt,
  });
}

function insertCommits(
  versionId: string,
  count: number,
  options: { firstOrdinal?: number; idPrefix?: string } = {},
): CommitRow[] {
  const firstOrdinal = options.firstOrdinal ?? 1;
  const idPrefix = options.idPrefix ?? "cmt";
  return bulkInsertCommits(
    database.db,
    Array.from({ length: count }, (_, index) => {
      const ordinal = firstOrdinal + index;
      return {
        id: `${idPrefix}_${ordinal}`,
        versionId,
        sha: `${idPrefix}-sha-${ordinal}`,
        parentSha: ordinal === firstOrdinal ? null : `${idPrefix}-sha-${ordinal - 1}`,
        ordinal,
        title: `Commit ${ordinal}`,
      };
    }),
  );
}

function insertCommitFiles(
  commitId: string,
  values: Array<{
    id: string;
    oldPath: string | null;
    newPath: string | null;
    createdAt: number;
  }>,
): CommitFileRow[] {
  return bulkInsertCommitFiles(
    database.db,
    values.map((value) => ({
      ...value,
      commitId,
      changeType: value.oldPath === null ? "added" : "modified",
    })),
  );
}

function makeDiffBlock(commitFileId: string, ordinal: number): DiffBlockInsert {
  return {
    id: `blk_${ordinal}`,
    commitFileId,
    blockKey: `block-${ordinal}`,
    ordinal,
    contentHash: `hash-${ordinal}`,
    patch: `@@ patch ${ordinal}`,
  };
}

function seedCommit(): CommitRow {
  const version = insertVersion();
  return insertCommits(version.id, 1)[0];
}

function seedCommitFile(): CommitFileRow {
  const commit = seedCommit();
  return insertCommitFiles(commit.id, [
    { id: "file_seed", oldPath: "src/seed.ts", newPath: "src/seed.ts", createdAt: 100 },
  ])[0];
}

function seedDiffBlock(): DiffBlockRow {
  const file = seedCommitFile();
  return bulkInsertDiffBlocks(database.db, [makeDiffBlock(file.id, 1)])[0];
}

function seedTag(): ConcernTagRow {
  seedConcernTagsRepository(database.db);
  const tag = findConcernTagBySlug(database.db, "goal.initial-steering");
  if (tag === undefined) {
    throw new Error("Expected seeded concern tag.");
  }
  return tag;
}
