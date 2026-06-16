import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  createVersion,
  findCommitById,
  findCommitFileById,
  findConcernTagBySlug,
  seedConcernTagsRepository,
  type CommitFileRow,
  type CommitRow,
} from "../repositories/index.js";
import { createDecisionService } from "./decisionService.js";
import { PromptReviewServiceError } from "./errors.js";
import { createServiceContext, type RootServiceContext } from "./serviceContext.js";

let database: TempPromptReviewsDatabase;
let context: RootServiceContext;
let now: number;

const agent = { type: "agent", id: "agent-1", displayName: "Agent One" } as const;
const human = { type: "human", id: "reviewer", displayName: "Reviewer" } as const;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  seedConcernTagsRepository(database.db);
  now = 8_000;
  context = createServiceContext({ db: database.db, now: () => now });
});

afterEach(() => {
  database.cleanup();
});

describe("decision service", () => {
  it("allows an agent to propose a decision", () => {
    const { file } = seedReviewTarget("decision_agent_propose");
    const service = createDecisionService(context);

    const decision = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "accept",
      rationale: "Agent thinks this is safe.",
      proposedBy: agent,
      riskLevel: "low",
      confidence: "high",
    });

    expect(decision).toEqual({
      id: decision.id,
      scope: { type: "commit_file", commitFileId: file.id },
      status: "proposed",
      outcome: "accept",
      rationale: "Agent thinks this is safe.",
      proposedBy: agent,
      finalizedBy: undefined,
      createdAt: 8_000,
      finalizedAt: undefined,
      riskLevel: "low",
      confidence: "high",
      updatedAt: 8_000,
    });
  });

  it("allows a human to propose and update a decision", () => {
    const { file } = seedReviewTarget("decision_human_propose");
    const service = createDecisionService(context);
    const proposed = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "needs_tests",
      rationale: "Needs a targeted test.",
      proposedBy: human,
    });

    now = 8_001;
    const updated = service.updateDecision({
      decisionId: proposed.id,
      outcome: "accept_with_watch",
      rationale: "Covered by nearby regression tests.",
      actor: human,
      confidence: "medium",
    });

    expect(updated).toEqual({
      ...proposed,
      outcome: "accept_with_watch",
      rationale: "Covered by nearby regression tests.",
      confidence: "medium",
      updatedAt: 8_001,
    });
  });

  it("rejects agent finalization through the service guard", () => {
    const { file } = seedReviewTarget("decision_agent_finalize");
    const service = createDecisionService(context);
    const proposed = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "accept",
      rationale: "Agent proposal.",
      proposedBy: agent,
    });

    try {
      service.finalizeDecision({
        decisionId: proposed.id,
        status: "accepted",
        finalizer: agent,
        rationale: "Agent tried to finalize.",
      });
      throw new Error("Expected agent finalization to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(PromptReviewServiceError);
      expect((error as PromptReviewServiceError).code).toBe("invariant_failed");
    }
  });

  it("allows a human to finalize a decision", () => {
    const { file } = seedReviewTarget("decision_human_finalize");
    const service = createDecisionService(context);
    const proposed = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "patch_required",
      rationale: "Patch needed.",
      proposedBy: agent,
    });

    now = 8_001;
    const finalized = service.finalizeDecision({
      decisionId: proposed.id,
      status: "accepted",
      finalizer: human,
      rationale: "Human agrees patch is required.",
    });

    expect(finalized).toEqual({
      ...proposed,
      status: "accepted",
      rationale: "Human agrees patch is required.",
      finalizedBy: human,
      finalizedAt: 8_001,
      updatedAt: 8_001,
    });
  });

  it("accepted decisions recompute file and commit status", () => {
    const { commit, file } = seedReviewTarget("decision_recompute");
    tagFile(file.id);
    const service = createDecisionService(context);
    const proposed = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "accept",
      rationale: "Ready.",
      proposedBy: agent,
    });

    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("needs_decision");

    service.finalizeDecision({
      decisionId: proposed.id,
      status: "accepted",
      finalizer: human,
      rationale: "Accepted by reviewer.",
    });

    expect(findCommitFileById(database.db, file.id)?.reviewStatus).toBe("accepted");
    expect(findCommitById(database.db, commit.id)?.reviewStatus).toBe("accepted");
  });

  it("enforces one accepted non-superseded decision per target", () => {
    const { file } = seedReviewTarget("decision_one_accepted");
    tagFile(file.id);
    const service = createDecisionService(context);
    const first = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "accept",
      rationale: "First.",
      proposedBy: human,
    });
    const second = service.proposeDecision({
      scope: { type: "commit_file", commitFileId: file.id },
      outcome: "accept_with_watch",
      rationale: "Second.",
      proposedBy: human,
    });

    service.finalizeDecision({ decisionId: first.id, status: "accepted", finalizer: human });

    expect(() => service.finalizeDecision({ decisionId: second.id, status: "accepted", finalizer: human })).toThrow(
      PromptReviewServiceError,
    );
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
