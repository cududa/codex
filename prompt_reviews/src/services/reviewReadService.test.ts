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
  createVersion,
  findCommitFileById,
  findConcernTagBySlug,
  listTaggingsByTarget,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
  type DiffBlockRow,
} from "../repositories/index.js";
import { CommitDetailSchema, CommitFileDetailSchema } from "../domain/schemas/index.js";
import { PromptReviewServiceError } from "./errors.js";
import { createReviewReadService } from "./reviewReadService.js";
import { createServiceContext, type RootServiceContext } from "./serviceContext.js";

let database: TempPromptReviewsDatabase;
let context: RootServiceContext;

const agent = { type: "agent", id: "agent-1", displayName: "Agent One" } as const;
const human = { type: "human", id: "reviewer", displayName: "Reviewer" } as const;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  seedConcernTagsRepository(database.db);
  context = createServiceContext({ db: database.db, now: () => 10_000 });
});

afterEach(() => {
  database.cleanup();
});

describe("review read service", () => {
  it("returns commit detail through the hand-authored boundary schema", () => {
    const { commit, file, block } = seedReviewGraph("detail");
    seedPrimaryTag("commit", commit.id, "goal.initial-steering", "tgg_commit");
    seedPrimaryTag("commit_file", file.id, "prompt.fidelity", "tgg_file");
    addComment(database.db, {
      id: "com_commit",
      scope: "commit",
      commitId: commit.id,
      body: "Commit-level note.",
      status: "open",
      authorActorType: "agent",
      createdAt: 201,
    });
    createDecision(database.db, {
      id: "dec_commit",
      scope: "commit",
      commitId: commit.id,
      status: "accepted",
      outcome: "accept_with_watch",
      rationale: "Commit is acceptable with monitoring.",
      proposedByActorType: "agent",
      finalizedByActorType: "human",
      finalizedAt: 202,
    });
    createPlan(database.db, {
      id: "pln_commit",
      scope: "commit",
      commitId: commit.id,
      title: "Commit follow-up",
      status: "proposed",
      proposedByActorType: "agent",
    });

    const detail = createReviewReadService(context).getCommitDetail(commit.id);

    expect(CommitDetailSchema.safeParse(detail).success).toBe(true);
    expect(detail).toMatchObject({
      id: commit.id,
      message: "Body for detail.",
      primaryTagSlug: "goal.initial-steering",
      files: [
        {
          id: file.id,
          primaryTagSlug: "prompt.fidelity",
          diffBlocks: [{ id: block.id, heading: "Prompt construction" }],
        },
      ],
      queuedFiles: [{ id: file.id }],
      comments: [{ id: "com_commit" }],
      decisions: [{ id: "dec_commit" }],
      plans: [{ id: "pln_commit" }],
    });
  });

  it("returns file detail with structured diff blocks and review summary", () => {
    const { file, block } = seedReviewGraph("file_detail");
    seedPrimaryTag("commit_file", file.id, "goal.initial-steering", "tgg_file_detail");
    seedPrimaryTag("diff_block", block.id, "prompt.fidelity", "tgg_block_detail");
    addComment(database.db, {
      id: "com_file_detail",
      scope: "commit_file",
      commitFileId: file.id,
      body: "File note.",
      status: "open",
      authorActorType: "human",
      createdAt: 301,
    });
    addComment(database.db, {
      id: "com_block_detail",
      scope: "diff_block",
      diffBlockId: block.id,
      anchorKind: "block",
      anchorDiffBlockId: block.id,
      body: "Block note.",
      status: "open",
      authorActorType: "agent",
      createdAt: 302,
    });
    createDecision(database.db, {
      id: "dec_file_detail",
      scope: "commit_file",
      commitFileId: file.id,
      status: "accepted",
      outcome: "accept",
      rationale: "File is accepted.",
      proposedByActorType: "human",
      finalizedByActorType: "human",
      finalizedAt: 303,
    });
    createPlan(database.db, {
      id: "pln_file_detail",
      scope: "commit_file",
      commitFileId: file.id,
      title: "File plan",
      status: "accepted",
      proposedByActorType: "agent",
    });

    const detail = createReviewReadService(context).getCommitFileDetail(file.id);

    expect(CommitFileDetailSchema.safeParse(detail).success).toBe(true);
    expect(detail.diffBlocks).toEqual([
      {
        id: block.id,
        commitFileId: file.id,
        heading: "Prompt construction",
        oldStartLine: 5,
        oldEndLine: 7,
        newStartLine: 5,
        newEndLine: 8,
        patch: "@@ -5,3 +5,4 @@\n-old\n+new",
        taggings: [
          expect.objectContaining({
            id: "tgg_block_detail",
            tag: expect.objectContaining({ slug: "prompt.fidelity" }),
          }),
        ],
        comments: [expect.objectContaining({ id: "com_block_detail" })],
        decision: undefined,
      },
    ]);
    expect(detail.review).toMatchObject({
      taggings: [{ id: "tgg_file_detail" }],
      comments: [{ id: "com_file_detail" }],
      decisions: [{ id: "dec_file_detail" }],
      plans: [{ id: "pln_file_detail" }],
    });
  });

  it("lists active concern tags in tree order as boundary views", () => {
    const tags = createReviewReadService(context).listConcernTags();

    const rootIndex = tags.findIndex((tag) => tag.slug === "goal-steering-contract");
    const childIndex = tags.findIndex((tag) => tag.slug === "goal.initial-steering");

    expect(rootIndex).toBeGreaterThanOrEqual(0);
    expect(childIndex).toBeGreaterThan(rootIndex);
    expect(tags[childIndex]).toMatchObject({
      slug: "goal.initial-steering",
      parentSlug: "goal-steering-contract",
      examples: expect.any(Array),
      pitfalls: expect.any(Array),
    });
  });

  it("lists comments by version, commit file, and status filters", () => {
    const { versionId, commit, file, block } = seedReviewGraph("comments");
    const other = seedReviewGraph("comments_other");
    addComment(database.db, {
      id: "com_version",
      scope: "version",
      versionId,
      body: "Version note.",
      status: "open",
      authorActorType: "agent",
      createdAt: 401,
    });
    addComment(database.db, {
      id: "com_commit",
      scope: "commit",
      commitId: commit.id,
      body: "Commit note.",
      status: "resolved",
      authorActorType: "agent",
      createdAt: 402,
      resolvedAt: 403,
      resolvedByActorType: "human",
    });
    addComment(database.db, {
      id: "com_file",
      scope: "commit_file",
      commitFileId: file.id,
      body: "File note.",
      status: "open",
      authorActorType: "human",
      createdAt: 404,
    });
    addComment(database.db, {
      id: "com_block",
      scope: "diff_block",
      diffBlockId: block.id,
      body: "Block note.",
      status: "open",
      authorActorType: "agent",
      createdAt: 405,
    });
    addComment(database.db, {
      id: "com_other",
      scope: "commit_file",
      commitFileId: other.file.id,
      body: "Other version note.",
      status: "open",
      authorActorType: "agent",
      createdAt: 406,
    });

    const service = createReviewReadService(context);

    expect(service.listComments({ versionId }).map((comment) => comment.id)).toEqual([
      "com_version",
      "com_commit",
      "com_file",
      "com_block",
    ]);
    expect(service.listComments({ commitFileId: file.id, status: "open" }).map((comment) => comment.id)).toEqual([
      "com_file",
      "com_block",
    ]);
    expect(() => service.listComments({ versionId, commitId: commit.id })).toThrow(PromptReviewServiceError);
  });

  it("lists missing decisions for commit and file targets", () => {
    const { versionId, commit, file } = seedReviewGraph("missing_decisions");
    const [decidedCommit] = bulkInsertCommits(database.db, [
      {
        id: "cmt_missing_decisions_done",
        versionId,
        sha: "sha-missing-decisions-done",
        ordinal: 2,
        title: "Decided commit",
      },
    ]);
    const [decidedFile] = bulkInsertCommitFiles(database.db, [
      {
        id: "file_missing_decisions_done",
        commitId: decidedCommit.id,
        oldPath: "src/decided.ts",
        newPath: "src/decided.ts",
        changeType: "modified",
        createdAt: 111,
      },
    ]);
    seedPrimaryTag("commit", commit.id, "goal.initial-steering", "tgg_missing_commit");
    seedPrimaryTag("commit", decidedCommit.id, "goal.initial-steering", "tgg_decided_commit");
    seedPrimaryTag("commit_file", file.id, "prompt.fidelity", "tgg_missing_file");
    seedPrimaryTag("commit_file", decidedFile.id, "prompt.fidelity", "tgg_decided_file");
    createDecision(database.db, {
      id: "dec_decided_commit",
      scope: "commit",
      commitId: decidedCommit.id,
      status: "accepted",
      outcome: "accept",
      rationale: "Commit accepted.",
      proposedByActorType: "human",
      finalizedByActorType: "human",
      finalizedAt: 501,
    });
    createDecision(database.db, {
      id: "dec_decided_file",
      scope: "commit_file",
      commitFileId: decidedFile.id,
      status: "accepted",
      outcome: "accept",
      rationale: "File accepted.",
      proposedByActorType: "human",
      finalizedByActorType: "human",
      finalizedAt: 502,
    });

    const service = createReviewReadService(context);

    expect(service.listMissingDecisions({ versionId, target: "commit" })).toEqual({
      target: "commit",
      data: [expect.objectContaining({ id: commit.id })],
    });
    expect(service.listMissingDecisions({ versionId, target: "file" })).toEqual({
      target: "file",
      data: [expect.objectContaining({ id: file.id })],
    });
  });

  it("creates and deletes taggings while preserving primary-tag invariants", () => {
    const { file } = seedReviewGraph("tagging_commands");
    const service = createReviewReadService(context);

    const first = service.createTagging({
      scope: { type: "commit_file", commitFileId: file.id },
      tagSlug: "goal.initial-steering",
      kind: "primary",
      rationale: "Initial primary.",
      actor: agent,
    });
    const replacement = service.createTagging({
      scope: { type: "commit_file", commitFileId: file.id },
      tagSlug: "prompt.fidelity",
      kind: "primary",
      actor: human,
    });

    expect(first.tag.slug).toBe("goal.initial-steering");
    expect(replacement.tag.slug).toBe("prompt.fidelity");
    expect(listTaggingsByTarget(database.db, { targetType: "commit_file", targetId: file.id }).map((tagging) => tagging.id)).toEqual([
      replacement.id,
    ]);
    expect(() =>
      service.createTagging({
        scope: { type: "commit_file", commitFileId: file.id },
        tagSlug: "prompt.fidelity",
        kind: "secondary",
        actor: agent,
      }),
    ).toThrow(PromptReviewServiceError);

    const deleted = service.deleteTagging({ taggingId: replacement.id, actor: human, reason: "Reclassify later." });

    expect(deleted.id).toBe(replacement.id);
    expect(listTaggingsByTarget(database.db, { targetType: "commit_file", targetId: file.id })).toEqual([]);
    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("needs_classification");
  });

  it("maps unknown tagging deletes to service notFound", () => {
    const service = createReviewReadService(context);

    expect(() =>
      service.deleteTagging({
        taggingId: "tgg_missing",
        actor: human,
        reason: "No longer applies.",
      }),
    ).toThrow(PromptReviewServiceError);

    try {
      service.deleteTagging({
        taggingId: "tgg_missing",
        actor: human,
        reason: "No longer applies.",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PromptReviewServiceError);
      expect((error as PromptReviewServiceError).code).toBe("not_found");
    }
  });
});

function seedReviewGraph(id: string): {
  versionId: string;
  commit: CommitRow;
  file: CommitFileRow;
  block: DiffBlockRow;
} {
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
      title: `Commit ${id}`,
      message: `Body for ${id}.`,
      authorName: "OpenAI",
      committedAt: 100,
    },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: `file_${id}`,
      commitId: commit.id,
      oldPath: `src/${id}.ts`,
      newPath: `src/${id}.ts`,
      changeType: "modified",
      createdAt: 101,
    },
  ]);
  const [block] = bulkInsertDiffBlocks(database.db, [
    {
      id: `blk_${id}`,
      commitFileId: file.id,
      blockKey: `block-${id}`,
      ordinal: 1,
      contentHash: `hash-${id}`,
      heading: "Prompt construction",
      oldStartLine: 5,
      oldEndLine: 7,
      newStartLine: 5,
      newEndLine: 8,
      patch: "@@ -5,3 +5,4 @@\n-old\n+new",
    },
  ]);
  return { versionId: version.id, commit, file, block };
}

function seedPrimaryTag(
  targetType: "commit" | "commit_file" | "diff_block",
  targetId: string,
  slug: string,
  id: string,
): void {
  const tag = findConcernTagBySlug(database.db, slug);
  if (tag === undefined) {
    throw new Error(`Expected seeded concern tag ${slug}.`);
  }
  addTagging(database.db, {
    id,
    tagId: tag.id,
    targetType,
    targetId,
    kind: "primary",
    createdByActorType: "human",
    createdAt: 200,
  });
}
