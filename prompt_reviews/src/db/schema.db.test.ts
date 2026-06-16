import { eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  comments,
  classificationMetadata,
  commitFiles,
  commits,
  concernTags,
  decisionComments,
  decisions,
  diffBlocks,
  planComments,
  planDecisions,
  planDiffBlocks,
  planItems,
  plans,
  schemaTables,
  taggings,
  versions,
} from "./schema.js";
import { seedConcernTags } from "./seedConcernTags.js";
import {
  commitRowSchemas,
  classificationMetadataRowSchemas,
  commitFileRowSchemas,
  concernTagRowSchemas,
  decisionRowSchemas,
  versionRowSchemas,
} from "./rowSchemas.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";

const forbiddenPersistenceNames = [
  "review_path",
  "markdown_path",
  "folder",
  "bundle",
  "artifact",
  "review_file",
  "comments_json",
] as const;

const expectedUniqueIndexes = [
  "versions_label_unique",
  "versions_base_target_unique",
  "commits_version_sha_unique",
  "commits_version_ordinal_unique",
  "commit_files_commit_paths_unique",
  "commit_files_commit_added_new_unique",
  "commit_files_commit_deleted_old_unique",
  "diff_blocks_file_key_unique",
  "diff_blocks_file_ordinal_unique",
  "concern_tags_slug_unique",
  "taggings_tag_target_unique",
  "classification_metadata_target_unique",
  "plan_items_plan_ordinal_unique",
  "plan_comments_plan_comment_unique",
  "plan_decisions_plan_decision_unique",
  "plan_diff_blocks_plan_diff_block_unique",
  "decision_comments_decision_comment_unique",
] as const;

let openedDatabases: TempPromptReviewsDatabase[] = [];

afterEach(() => {
  for (const database of openedDatabases.splice(0)) {
    database.cleanup();
  }
});

function openMigratedDb(): TempPromptReviewsDatabase {
  const database = createTempPromptReviewsDatabase({ migrate: true });
  openedDatabases.push(database);
  return database;
}

function expectConstraintFailure(action: () => void): void {
  expect(action).toThrow(/constraint|foreign key|unique/i);
}

function insertVersion(database: TempPromptReviewsDatabase, id = "ver_1"): void {
  database.db.insert(versions).values({
    id,
    repositoryId: "codex",
    label: id,
    baseSha: `${id}_base`,
    targetSha: `${id}_target`,
  }).run();
}

function insertCommit(database: TempPromptReviewsDatabase, id = "cmt_1", ordinal = 1): void {
  database.db.insert(commits).values({
    id,
    versionId: "ver_1",
    sha: `${id}_sha`,
    ordinal,
    title: `Commit ${ordinal}`,
  }).run();
}

function insertCommitFile(
  database: TempPromptReviewsDatabase,
  values: {
    id: string;
    oldPath: string | null;
    newPath: string | null;
    changeType: "added" | "modified" | "deleted" | "renamed" | "copied" | "mode_changed";
  },
): void {
  database.db.insert(commitFiles).values({
    commitId: "cmt_1",
    ...values,
  }).run();
}

function insertDiffBlock(database: TempPromptReviewsDatabase, id = "blk_1", ordinal = 1): void {
  database.db.insert(diffBlocks).values({
    id,
    commitFileId: "file_modified",
    blockKey: `block-${ordinal}`,
    ordinal,
    contentHash: `hash-${ordinal}`,
    patch: "@@ patch",
  }).run();
}

function seedReviewGraph(database: TempPromptReviewsDatabase): void {
  insertVersion(database);
  insertCommit(database);
  insertCommitFile(database, {
    id: "file_modified",
    oldPath: "src/old.ts",
    newPath: "src/new.ts",
    changeType: "modified",
  });
  insertDiffBlock(database);
  seedConcernTags(database.db);
}

describe("Drizzle schema and migrations", () => {
  it("applies migrations to an empty SQLite database", () => {
    const database = openMigratedDb();

    const tableNames = database.sqlite
      .prepare("select name from sqlite_master where type = 'table' order by name")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tableNames).toEqual(expect.arrayContaining(["versions", "commits", "commit_files", "diff_blocks"]));
    expect(database.sqlite.pragma("foreign_keys", { simple: true })).toBe(1);

    const indexNames = database.sqlite
      .prepare("select name from sqlite_master where type = 'index'")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(indexNames).toEqual(expect.arrayContaining([...expectedUniqueIndexes]));
  });

  it("rejects orphan rows when foreign keys are enabled", () => {
    const database = openMigratedDb();

    expectConstraintFailure(() => {
      database.db.insert(commits).values({
        id: "orphan",
        versionId: "missing",
        sha: "abc",
        ordinal: 1,
        title: "Orphan",
      }).run();
    });
  });

  it("supports added, deleted, copied, renamed, and modified file path facts without sentinels", () => {
    const database = openMigratedDb();
    insertVersion(database);
    insertCommit(database);

    insertCommitFile(database, { id: "file_added", oldPath: null, newPath: "src/added.ts", changeType: "added" });
    insertCommitFile(database, { id: "file_copied", oldPath: null, newPath: "src/copied.ts", changeType: "copied" });
    insertCommitFile(database, { id: "file_deleted", oldPath: "src/deleted.ts", newPath: null, changeType: "deleted" });
    insertCommitFile(database, {
      id: "file_renamed",
      oldPath: "src/before.ts",
      newPath: "src/after.ts",
      changeType: "renamed",
    });
    insertCommitFile(database, {
      id: "file_modified",
      oldPath: "src/same.ts",
      newPath: "src/same.ts",
      changeType: "modified",
    });

    const rows = database.db.select().from(commitFiles).all();

    expect(rows.map(({ id, oldPath, newPath, changeType }) => ({ id, oldPath, newPath, changeType }))).toEqual([
      { id: "file_added", oldPath: null, newPath: "src/added.ts", changeType: "added" },
      { id: "file_copied", oldPath: null, newPath: "src/copied.ts", changeType: "copied" },
      { id: "file_deleted", oldPath: "src/deleted.ts", newPath: null, changeType: "deleted" },
      { id: "file_renamed", oldPath: "src/before.ts", newPath: "src/after.ts", changeType: "renamed" },
      { id: "file_modified", oldPath: "src/same.ts", newPath: "src/same.ts", changeType: "modified" },
    ]);
  });

  it("rejects duplicate values for implemented unique constraints", () => {
    const database = openMigratedDb();
    seedReviewGraph(database);
    const tag = database.db.select().from(concernTags).where(eq(concernTags.slug, "goal.initial-steering")).get();
    if (tag === undefined) {
      throw new Error("Expected seeded concern tag");
    }

    expectConstraintFailure(() => {
      database.db.insert(versions).values({
        id: "ver_duplicate_label",
        repositoryId: "codex",
        label: "ver_1",
        baseSha: "different_base",
        targetSha: "different_target",
      }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(versions).values({
        id: "ver_duplicate_range",
        repositoryId: "codex",
        label: "different",
        baseSha: "ver_1_base",
        targetSha: "ver_1_target",
      }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(commits).values({
        id: "cmt_duplicate_sha",
        versionId: "ver_1",
        sha: "cmt_1_sha",
        ordinal: 2,
        title: "Duplicate SHA",
      }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(commits).values({
        id: "cmt_duplicate_ordinal",
        versionId: "ver_1",
        sha: "different_sha",
        ordinal: 1,
        title: "Duplicate ordinal",
      }).run();
    });
    expectConstraintFailure(() => {
      insertCommitFile(database, {
        id: "file_duplicate_paths",
        oldPath: "src/old.ts",
        newPath: "src/new.ts",
        changeType: "modified",
      });
    });
    insertCommitFile(database, { id: "file_added", oldPath: null, newPath: "src/added.ts", changeType: "added" });
    insertCommitFile(database, { id: "file_deleted", oldPath: "src/deleted.ts", newPath: null, changeType: "deleted" });
    expectConstraintFailure(() => {
      insertCommitFile(database, {
        id: "file_duplicate_added",
        oldPath: null,
        newPath: "src/added.ts",
        changeType: "added",
      });
    });
    expectConstraintFailure(() => {
      insertCommitFile(database, {
        id: "file_duplicate_deleted",
        oldPath: "src/deleted.ts",
        newPath: null,
        changeType: "deleted",
      });
    });
    expectConstraintFailure(() => {
      insertCommitFile(database, {
        id: "file_without_paths",
        oldPath: null,
        newPath: null,
        changeType: "modified",
      });
    });
    expectConstraintFailure(() => {
      database.db.insert(diffBlocks).values({
        id: "blk_duplicate_key",
        commitFileId: "file_modified",
        blockKey: "block-1",
        ordinal: 2,
        contentHash: "different-hash",
        patch: "@@ patch",
      }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(diffBlocks).values({
        id: "blk_duplicate_ordinal",
        commitFileId: "file_modified",
        blockKey: "different-key",
        ordinal: 1,
        contentHash: "different-hash",
        patch: "@@ patch",
      }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(concernTags).values({
        id: "tag_duplicate_slug",
        slug: tag.slug,
        label: "Duplicate",
        description: "Duplicate",
        sortOrder: 1,
      }).run();
    });
    database.db.insert(taggings).values({
      id: "tgg_1",
      tagId: tag.id,
      targetType: "commit_file",
      targetId: "file_modified",
      kind: "primary",
      createdByActorType: "human",
    }).run();
    expectConstraintFailure(() => {
      database.db.insert(taggings).values({
        id: "tgg_duplicate",
        tagId: tag.id,
        targetType: "commit_file",
        targetId: "file_modified",
        kind: "secondary",
        createdByActorType: "agent",
      }).run();
    });

    database.db.insert(comments).values({
      id: "com_1",
      scope: "commit_file",
      commitFileId: "file_modified",
      body: "Needs a look",
      authorActorType: "human",
    }).run();
    database.db.insert(decisions).values({
      id: "dec_1",
      scope: "commit_file",
      commitFileId: "file_modified",
      outcome: "accept",
      rationale: "Looks okay",
      proposedByActorType: "human",
    }).run();
    database.db.insert(plans).values({
      id: "pln_1",
      scope: "commit_file",
      commitFileId: "file_modified",
      title: "Patch plan",
      proposedByActorType: "human",
    }).run();
    database.db.insert(planItems).values({
      id: "pli_1",
      planId: "pln_1",
      ordinal: 1,
      title: "Do the thing",
    }).run();
    database.db.insert(planComments).values({ id: "plc_1", planId: "pln_1", commentId: "com_1" }).run();
    database.db.insert(planDecisions).values({ id: "pld_1", planId: "pln_1", decisionId: "dec_1" }).run();
    database.db.insert(planDiffBlocks).values({ id: "pdb_1", planId: "pln_1", diffBlockId: "blk_1" }).run();
    database.db.insert(decisionComments).values({ id: "dcm_1", decisionId: "dec_1", commentId: "com_1" }).run();

    expectConstraintFailure(() => {
      database.db.insert(planItems).values({
        id: "pli_duplicate",
        planId: "pln_1",
        ordinal: 1,
        title: "Duplicate",
      }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(planComments).values({ id: "plc_duplicate", planId: "pln_1", commentId: "com_1" }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(planDecisions).values({ id: "pld_duplicate", planId: "pln_1", decisionId: "dec_1" }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(planDiffBlocks).values({ id: "pdb_duplicate", planId: "pln_1", diffBlockId: "blk_1" }).run();
    });
    expectConstraintFailure(() => {
      database.db.insert(decisionComments).values({
        id: "dcm_duplicate",
        decisionId: "dec_1",
        commentId: "com_1",
      }).run();
    });
  });

  it("parses DB rows and rejects invalid enum or nullability values", () => {
    const database = openMigratedDb();
    seedReviewGraph(database);
    const version = database.db.select().from(versions).get();
    const commitFile = database.db.select().from(commitFiles).get();
    const concernTag = database.db.select().from(concernTags).get();
    if (version === undefined || commitFile === undefined || concernTag === undefined) {
      throw new Error("Expected rows for row schema tests");
    }

    expect(versionRowSchemas.select.parse(version)).toEqual(version);
    expect(commitRowSchemas.insert.parse({
      versionId: "ver_1",
      sha: "sha-with-parent",
      parentSha: "parent-sha",
      ordinal: 2,
      title: "Commit with parent",
    })).toMatchObject({ parentSha: "parent-sha" });
    expect(commitFileRowSchemas.select.parse(commitFile)).toEqual(commitFile);
    expect(concernTagRowSchemas.select.parse(concernTag)).toEqual(concernTag);
    expect(commitFileRowSchemas.insert.parse({
      commitId: "cmt_1",
      oldPath: null,
      newPath: "src/added.ts",
      changeType: "added",
    })).toMatchObject({ oldPath: null, newPath: "src/added.ts" });
    expect(versionRowSchemas.select.safeParse({ ...version, status: "surprising" }).success).toBe(false);
    expect(versionRowSchemas.select.safeParse({ ...version, label: null }).success).toBe(false);
    expect(decisionRowSchemas.insert.safeParse({
      scope: "commit_file",
      commitFileId: "file_modified",
      outcome: "mystery",
      rationale: "Nope",
      proposedByActorType: "human",
    }).success).toBe(false);
    expect(classificationMetadataRowSchemas.insert.parse({
      targetType: "commit_file",
      targetId: "file_modified",
      summary: "Classified target.",
      riskLevel: "low",
      confidence: "high",
      updatedByActorType: "agent",
    })).toMatchObject({ targetType: "commit_file", riskLevel: "low", confidence: "high" });
  });

  it("enforces status override reason checks for commits and commit files", () => {
    const database = openMigratedDb();
    seedReviewGraph(database);

    expectConstraintFailure(() => {
      database.db.update(commits).set({
        statusOverride: "blocked",
        statusOverrideReason: "",
        statusOverrideActorType: "human",
        statusOverrideAt: 123,
      }).where(eq(commits.id, "cmt_1")).run();
    });
    expectConstraintFailure(() => {
      database.db.update(commitFiles).set({
        statusOverride: "blocked",
        statusOverrideReason: null,
        statusOverrideActorType: "human",
        statusOverrideAt: 123,
      }).where(eq(commitFiles.id, "file_modified")).run();
    });

    database.db.update(commits).set({
      statusOverride: "blocked",
      statusOverrideReason: "Manual hold.",
      statusOverrideActorType: "human",
      statusOverrideAt: 123,
    }).where(eq(commits.id, "cmt_1")).run();
    database.db.update(commitFiles).set({
      statusOverride: "patch_required",
      statusOverrideReason: "Patch needed.",
      statusOverrideActorType: "agent",
      statusOverrideAt: 124,
    }).where(eq(commitFiles.id, "file_modified")).run();

    expect(database.db.select().from(commits).where(eq(commits.id, "cmt_1")).get()).toMatchObject({
      statusOverride: "blocked",
      statusOverrideReason: "Manual hold.",
    });
    expect(database.db.select().from(commitFiles).where(eq(commitFiles.id, "file_modified")).get()).toMatchObject({
      statusOverride: "patch_required",
      statusOverrideReason: "Patch needed.",
    });
  });

  it("seeds concern tags idempotently and preserves local narrative edits", () => {
    const database = openMigratedDb();

    seedConcernTags(database.db);
    const firstCount = database.db.select().from(concernTags).all().length;
    const tag = database.db.select().from(concernTags).where(eq(concernTags.slug, "goal.initial-steering")).get();
    if (tag === undefined) {
      throw new Error("Expected seeded tag");
    }
    database.db.update(concernTags).set({
      description: "Local description",
      examplesJson: JSON.stringify(["Local example"]),
      pitfallsJson: JSON.stringify(["Local pitfall"]),
      isActive: false,
    }).where(eq(concernTags.id, tag.id)).run();

    seedConcernTags(database.db);
    const rows = database.db.select().from(concernTags).all();
    const edited = database.db.select().from(concernTags).where(eq(concernTags.id, tag.id)).get();

    expect(rows.length).toBe(firstCount);
    expect(edited).toMatchObject({
      description: "Local description",
      examplesJson: JSON.stringify(["Local example"]),
      pitfallsJson: JSON.stringify(["Local pitfall"]),
      isActive: true,
    });
  });

  it("keeps legacy generated artifact names out of table and column names", () => {
    const names = schemaTables.flatMap((table) => {
      const config = getTableConfig(table);
      return [config.name, ...config.columns.map((column) => column.name)];
    });

    expect(
      names.filter((name) => forbiddenPersistenceNames.some((forbidden) => name.toLowerCase().includes(forbidden))),
    ).toEqual([]);
  });
});
