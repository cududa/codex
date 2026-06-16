import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GitClient } from "../git/gitClient.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  createDecision,
  createVersion,
  findConcernTagBySlug,
  findVersionById,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import { PromptReviewServiceError } from "./errors.js";
import { createServiceContext, type RootServiceContext } from "./serviceContext.js";
import { createStatusService } from "./statusService.js";
import { createVersionService } from "./versionService.js";

let database: TempPromptReviewsDatabase;
let context: RootServiceContext;
let now: number;

const agent = { type: "agent", id: "agent-1", displayName: "Agent One" } as const;
const human = { type: "human", id: "reviewer", displayName: "Reviewer" } as const;

const gitClient: GitClient = {
  async resolveRef(refOrSha) {
    return refOrSha === "base" ? "1".repeat(40) : "2".repeat(40);
  },
  async listCommits() {
    return [];
  },
  async listChangedFiles() {
    return [];
  },
  async getCommitDiff() {
    return "";
  },
};

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  seedConcernTagsRepository(database.db);
  now = 10_000;
  context = createServiceContext({ db: database.db, now: () => now });
});

afterEach(() => {
  database.cleanup();
});

describe("version service", () => {
  it("wraps populateNextVersion through the service boundary", async () => {
    const service = createVersionService(context, { gitClient });

    await expect(
      service.populateNextVersion({
        repositoryId: "codex",
        baseRefOrSha: "base",
        targetRef: "target",
        label: "version-populate",
      }),
    ).resolves.toMatchObject({
      baseSha: "1".repeat(40),
      targetSha: "2".repeat(40),
      created: true,
    });
  });

  it("lists and details ready versions without auto-closing them", () => {
    const { version, commit } = seedAcceptedVersion("version_ready");
    createStatusService(context).recomputeVersionStatus(version.id);
    const service = createVersionService(context, { gitClient });

    expect(service.listVersions({ repositoryId: "codex" }).map((item) => item.id)).toEqual([version.id]);
    expect(service.getVersionDetail({ versionId: version.id })).toMatchObject({
      id: version.id,
      status: "ready",
      closedAt: undefined,
      commits: [
        {
          id: commit.id,
          status: "accepted",
          fileCount: 1,
        },
      ],
      remainingWork: [
        {
          kind: "version_closure",
          targetIds: [version.id],
        },
      ],
    });
    expect(findVersionById(database.db, version.id)?.status).toBe("ready");
    expect(findVersionById(database.db, version.id)?.closedAt).toBeNull();
  });

  it("requires a human actor to close a version through the service guard", () => {
    const { version } = seedAcceptedVersion("version_agent_close");
    createStatusService(context).recomputeVersionStatus(version.id);
    const service = createVersionService(context, { gitClient });

    try {
      service.closeVersion({
        versionId: version.id,
        finalizer: agent,
        summary: "Agent tried to close.",
      });
      throw new Error("Expected agent closure to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(PromptReviewServiceError);
      expect((error as PromptReviewServiceError).code).toBe("invariant_failed");
    }
  });

  it("requires readiness and no remaining blockers before explicit human closure", () => {
    const blocked = seedReviewTarget("version_blocked");
    const service = createVersionService(context, { gitClient });

    expect(() =>
      service.closeVersion({
        versionId: blocked.version.id,
        finalizer: human,
        summary: "Not ready.",
      }),
    ).toThrow(PromptReviewServiceError);

    const { version } = seedAcceptedVersion("version_close");
    now = 10_001;
    const closed = service.closeVersion({
      versionId: version.id,
      finalizer: human,
      summary: "Reviewed and ready.",
    });

    expect(closed).toMatchObject({
      id: version.id,
      status: "closed",
      closedAt: 10_001,
    });
    expect(findVersionById(database.db, version.id)).toMatchObject({
      status: "closed",
      closedAt: 10_001,
      closedByActorType: "human",
      closedByActorId: "reviewer",
      closureSummary: "Reviewed and ready.",
    });
  });
});

function seedReviewTarget(id: string): { version: VersionRow; commit: CommitRow; file: CommitFileRow } {
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
  return { version, commit, file };
}

function seedAcceptedVersion(id: string): { version: VersionRow; commit: CommitRow; file: CommitFileRow } {
  const seeded = seedReviewTarget(id);
  tagFile(seeded.file.id);
  createDecision(database.db, {
    id: `dec_${id}`,
    scope: "commit_file",
    commitFileId: seeded.file.id,
    status: "accepted",
    outcome: "accept",
    rationale: "Accepted.",
    proposedByActorType: "human",
    finalizedByActorType: "human",
    finalizedAt: 9_900,
  });
  return seeded;
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
