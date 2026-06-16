import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addComment as addCommentRow,
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  createDecision,
  createVersion,
  findCommitById,
  findCommitFileById,
  findConcernTagBySlug,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
} from "../repositories/index.js";
import { createCommentService } from "./commentService.js";
import { PromptReviewServiceError } from "./errors.js";
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
  now = 7_000;
  context = createServiceContext({ db: database.db, now: () => now });
});

afterEach(() => {
  database.cleanup();
});

describe("comment service", () => {
  it("adds a comment with a valid scope and range anchor", () => {
    const { file } = seedReviewTarget("comment_add");
    const service = createCommentService(context);

    const comment = service.addComment({
      scope: { type: "commit_file", commitFileId: file.id },
      anchor: { kind: "range", commitFileId: file.id, side: "new", startLine: 3, endLine: 5 },
      body: "Please verify the prompt wording.",
      author: agent,
    });

    expect(comment).toEqual({
      id: comment.id,
      scope: { type: "commit_file", commitFileId: file.id },
      status: "open",
      body: "Please verify the prompt wording.",
      author: agent,
      createdAt: 7_000,
      resolvedAt: undefined,
      anchor: { kind: "range", commitFileId: file.id, side: "new", startLine: 3, endLine: 5 },
      updatedAt: 7_000,
      resolvedBy: undefined,
      resolution: undefined,
    });
  });

  it("rejects invalid mixed scope parent ids and mismatched anchors", () => {
    const { commit, file, otherFile } = seedReviewTarget("comment_invalid");
    const service = createCommentService(context);

    expect(() =>
      service.addComment({
        scope: { type: "commit_file", commitFileId: file.id },
        anchor: { kind: "range", commitFileId: otherFile.id, side: "new", startLine: 1, endLine: 1 },
        body: "Wrong file.",
        author: agent,
      }),
    ).toThrow(PromptReviewServiceError);

    addCommentRow(database.db, {
      id: "com_mixed_parent",
      scope: "commit_file",
      commitId: commit.id,
      commitFileId: file.id,
      body: "Corrupt mixed parent row.",
      status: "open",
      authorActorType: "agent",
    });

    expect(() =>
      service.resolveComment({
        commentId: "com_mixed_parent",
        status: "resolved",
        resolution: "Cannot resolve corrupt row.",
        actor: human,
      }),
    ).toThrow(PromptReviewServiceError);
  });

  it("resolves comments with resolver fields and refreshes affected status", () => {
    const { commit, file } = seedAcceptedFile("comment_resolve");
    const service = createCommentService(context);
    expect(createStatusService(context).recomputeFileStatus(file.id).status).toBe("accepted");

    const added = service.addComment({
      scope: { type: "commit_file", commitFileId: file.id },
      anchor: { kind: "scope" },
      body: "This blocks acceptance.",
      author: agent,
    });
    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("blocked");
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("blocked");

    now = 7_001;
    const resolved = service.resolveComment({
      commentId: added.id,
      status: "resolved",
      resolution: "Verified by focused review.",
      actor: human,
    });

    expect(resolved).toEqual({
      ...added,
      status: "resolved",
      resolvedAt: 7_001,
      updatedAt: 7_001,
      resolvedBy: human,
      resolution: "Verified by focused review.",
    });
    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("accepted");
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("accepted");
  });

  it("reopens comments by clearing resolution fields and refreshing affected status", () => {
    const { file } = seedAcceptedFile("comment_reopen");
    const service = createCommentService(context);
    const added = service.addComment({
      scope: { type: "commit_file", commitFileId: file.id },
      anchor: { kind: "scope" },
      body: "Needs another pass.",
      author: agent,
    });
    now = 7_001;
    service.resolveComment({
      commentId: added.id,
      status: "resolved",
      resolution: "Closed once.",
      actor: human,
    });
    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("accepted");

    now = 7_002;
    const reopened = service.reopenComment({
      commentId: added.id,
      reason: "Regression returned.",
      actor: agent,
    });

    expect(reopened).toEqual({
      ...added,
      status: "open",
      updatedAt: 7_002,
      resolvedAt: undefined,
      resolvedBy: undefined,
      resolution: undefined,
    });
    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("blocked");
  });
});

function seedReviewTarget(id: string): { commit: CommitRow; file: CommitFileRow; otherFile: CommitFileRow } {
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
  const [file, otherFile] = bulkInsertCommitFiles(database.db, [
    makeFile(`file_${id}`, commit.id, 100),
    makeFile(`file_${id}_other`, commit.id, 101),
  ]);
  return { commit, file, otherFile };
}

function seedAcceptedFile(id: string): { commit: CommitRow; file: CommitFileRow } {
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
  const [file] = bulkInsertCommitFiles(database.db, [makeFile(`file_${id}`, commit.id, 100)]);
  tagFile(file.id);
  createDecision(database.db, {
    id: `dec_${id}`,
    scope: "commit_file",
    commitFileId: file.id,
    status: "accepted",
    outcome: "accept",
    rationale: "Human accepted.",
    proposedByActorType: "human",
    finalizedByActorType: "human",
    finalizedAt: 6_900,
  });
  return { commit, file };
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
