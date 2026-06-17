import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  createVersion,
  findCommitById,
  findCommitFileById,
  findConcernTagById,
  findVersionById,
  listPrimaryTaggingsByTarget,
  listTaggingsByTarget,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
} from "../repositories/index.js";
import { PromptReviewServiceError } from "./errors.js";
import { createClassificationService } from "./classificationService.js";
import { createServiceContext, type RootServiceContext } from "./serviceContext.js";

let database: TempPromptReviewsDatabase;
let context: RootServiceContext;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  seedConcernTagsRepository(database.db);
  context = createServiceContext({ db: database.db, now: () => 5_000 });
});

afterEach(() => {
  database.cleanup();
});

describe("classification service", () => {
  it("classifies a commit with one primary tag and refreshes commit and version status", () => {
    const { commit } = seedReviewTarget("commit_primary");
    const service = createClassificationService(context, { actor: { type: "agent", id: "agent-1" } });

    const classification = service.classifyCommit({
      commitId: commit.id,
      primaryTagSlug: "goal.initial-steering",
    });

    expect(classification.taggings.map((tagging) => ({ kind: tagging.kind, slug: tagging.tag.slug }))).toEqual([
      { kind: "primary", slug: "goal.initial-steering" },
    ]);
    expect(listPrimaryTaggingsByTarget(database.db, { targetType: "commit", targetId: commit.id })).toHaveLength(1);
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("needs_classification");
    expect(findCommitById(database.db, commit.id)?.updatedAt).toBe(5_000);
    expect(findVersionById(database.db, commit.versionId)?.status).toBe("reviewing");
    expect(findVersionById(database.db, commit.versionId)?.updatedAt).toBe(5_000);
  });

  it("classifies a file with primary and secondary tags and refreshes affected statuses", () => {
    const { commit, file } = seedReviewTarget("file_primary");
    const service = createClassificationService(context, { actor: { type: "human", id: "reviewer" } });

    const classification = service.classifyFile({
      commitFileId: file.id,
      primaryTagSlug: "goal.initial-steering",
      secondaryTagSlugs: ["prompt.fidelity"],
    });

    expect(classification.taggings.map((tagging) => ({ kind: tagging.kind, slug: tagging.tag.slug }))).toEqual([
      { kind: "primary", slug: "goal.initial-steering" },
      { kind: "secondary", slug: "prompt.fidelity" },
    ]);
    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("needs_decision");
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("needs_decision");
  });

  it("replaces an existing primary without leaving two primary taggings", () => {
    const { file } = seedReviewTarget("file_replace_primary");
    const service = createClassificationService(context, { actor: { type: "agent", id: "agent-1" } });

    service.classifyFile({ commitFileId: file.id, primaryTagSlug: "goal.initial-steering" });
    service.classifyFile({ commitFileId: file.id, primaryTagSlug: "prompt.fidelity" });

    const primaryTaggings = listPrimaryTaggingsByTarget(database.db, { targetType: "commit_file", targetId: file.id });
    expect(primaryTaggings).toHaveLength(1);
    expect(findConcernTagById(database.db, primaryTaggings[0].tagId)?.slug).toBe("prompt.fidelity");
    expect(listTaggingsByTarget(database.db, { targetType: "commit_file", targetId: file.id })).toEqual(primaryTaggings);
  });

  it("returns taggings without storing classification metadata", () => {
    const { file } = seedReviewTarget("file_metadata");
    const service = createClassificationService(context, { actor: { type: "agent", id: "agent-1" } });

    const classification = service.classifyFile({
      commitFileId: file.id,
      primaryTagSlug: "goal.initial-steering",
    });

    expect(classification).toMatchObject({
      scope: { type: "commit_file", commitFileId: file.id },
      updatedBy: { type: "agent", id: "agent-1" },
      updatedAt: 5_000,
    });
    expect(classification.taggings).toHaveLength(1);
  });

  it("rejects a tag slug used as both primary and secondary", () => {
    const { file } = seedReviewTarget("file_duplicate_primary");
    const service = createClassificationService(context);

    expect(() =>
      service.classifyFile({
        commitFileId: file.id,
        primaryTagSlug: "goal.initial-steering",
        secondaryTagSlugs: ["goal.initial-steering"],
      }),
    ).toThrow(PromptReviewServiceError);
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
    {
      id: `cmt_${id}`,
      versionId: version.id,
      sha: `sha-${id}`,
      ordinal: 1,
      title: id,
    },
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
