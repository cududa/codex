import { describe, expect, it } from "vitest";
import {
  AgentReviewSchema,
  ConcernAreaSchema,
  ConcernAreaSelectionSchema,
  HumanApprovalSchema,
  LocalChangeRefSchema,
  ReviewBootstrapResponseSchema,
  ReviewCommitSchema,
  ReviewFileSchema,
  ReviewLedgerEntrySchema,
  ThreadedCommentSchema,
  concernAreaSlugs,
  concernAreas,
  requireConcernArea,
  reviewMarkDefinitions,
  reviewSchemas,
} from "./index.js";

const human = {
  type: "human",
  id: "human-1",
  displayName: "Human reviewer",
} as const;

const agent = {
  type: "agent",
  id: "agent-1",
  displayName: "Review agent",
} as const;

const now = "2026-06-17T12:00:00.000Z";

const localChangeRef = {
  id: "local-change-1",
  sha: "abcdef1",
  title: "Adapt prompt handling",
  linkedBy: human,
  linkedAt: now,
};

describe("review contracts", () => {
  it("defines exactly the canonical eight concern areas", () => {
    expect(concernAreaSlugs).toEqual([
      "harness-prompts",
      "message-roles",
      "hidden-context",
      "goal-continuation",
      "goal-behavior",
      "context-compaction",
      "tool-affordances",
      "permission-defaults",
    ]);
    expect(concernAreas.map((area) => area.slug)).toEqual(concernAreaSlugs);
    expect(requireConcernArea("tool-affordances")).toEqual({
      slug: "tool-affordances",
      label: "Tool Affordances",
      description: "Changes to tool availability, descriptions, schemas, routing, execution, or model-facing affordances.",
      sortOrder: 6,
    });
  });

  it("keeps concern area selection ordered and unique", () => {
    expect(ConcernAreaSelectionSchema.parse(["message-roles", "tool-affordances"])).toEqual([
      "message-roles",
      "tool-affordances",
    ]);
    expect(() => ConcernAreaSelectionSchema.parse(["message-roles", "message-roles"])).toThrow();
    expect(() =>
      ConcernAreaSelectionSchema.parse([
        "message-roles",
        "tool-affordances",
        "hidden-context",
        "permission-defaults",
      ]),
    ).toThrow();
  });

  it("defines canonical review mark metadata", () => {
    expect(reviewMarkDefinitions).toEqual([
      {
        mark: "PASS",
        label: "Pass",
        description: "Reviewed and no local adaptation is required.",
        isFinal: true,
        requiresLocalChangeRefs: false,
      },
      {
        mark: "FLAG",
        label: "Flag",
        description: "Investigation is required before the review can resolve to pass or modify.",
        isFinal: false,
        requiresLocalChangeRefs: false,
      },
      {
        mark: "MODIFY",
        label: "Modify",
        description: "The upstream change requires intentional local adaptation before approval.",
        isFinal: false,
        requiresLocalChangeRefs: false,
      },
      {
        mark: "DONE",
        label: "Done",
        description: "Required local adaptation is complete and linked to local commit evidence.",
        isFinal: true,
        requiresLocalChangeRefs: true,
      },
    ]);
  });

  it("rejects DONE commits without linked local change evidence", () => {
    expect(() =>
      ReviewCommitSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        title: "Adjust tool prompt",
        reviewMark: "DONE",
        concernAreas: ["tool-affordances"],
        localChangeRefs: [],
        agentReviews: [],
        humanApproval: null,
        fileCount: 1,
        unresolvedCommentCount: 0,
      }),
    ).toThrow();

    expect(
      ReviewCommitSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        title: "Adjust tool prompt",
        reviewMark: "DONE",
        concernAreas: ["tool-affordances"],
        localChangeRefs: [localChangeRef],
        agentReviews: [],
        humanApproval: null,
        fileCount: 1,
        unresolvedCommentCount: 0,
      }),
    ).toMatchObject({
      reviewMark: "DONE",
      localChangeRefs: [localChangeRef],
    });
  });

  it("keeps file review marks explicit and forbids file concern areas", () => {
    expect(
      ReviewFileSchema.parse({
        id: "file-1",
        commitId: "commit-1",
        path: "codex-rs/core/src/prompt.rs",
        changeKind: "modified",
        reviewMark: null,
        localChangeRefs: [],
        agentReviews: [],
        humanApproval: null,
        unresolvedCommentCount: 0,
      }),
    ).toMatchObject({ reviewMark: null });

    expect(() =>
      ReviewFileSchema.parse({
        id: "file-1",
        commitId: "commit-1",
        path: "codex-rs/core/src/prompt.rs",
        changeKind: "modified",
        reviewMark: "PASS",
        concernAreas: ["tool-affordances"],
        localChangeRefs: [],
        agentReviews: [],
        humanApproval: null,
        unresolvedCommentCount: 0,
      }),
    ).toThrow();
  });

  it("prevents agents from assigning concern areas to files", () => {
    expect(() =>
      AgentReviewSchema.parse({
        id: "agent-review-1",
        scope: { type: "file", fileId: "file-1" },
        reviewedMark: "FLAG",
        reviewedConcernAreas: ["message-roles"],
        reviewer: agent,
        reviewedAt: now,
      }),
    ).toThrow();
  });

  it("requires human approval to accept only final review marks", () => {
    expect(() =>
      HumanApprovalSchema.parse({
        id: "approval-1",
        scope: { type: "commit", commitId: "commit-1" },
        approvedMark: "MODIFY",
        approvedConcernAreas: ["tool-affordances"],
        localChangeRefs: [],
        approvedBy: human,
        approvedAt: now,
      }),
    ).toThrow();

    expect(
      HumanApprovalSchema.parse({
        id: "approval-1",
        scope: { type: "commit", commitId: "commit-1" },
        approvedMark: "DONE",
        approvedConcernAreas: ["tool-affordances"],
        localChangeRefs: [localChangeRef],
        approvedBy: human,
        approvedAt: now,
      }),
    ).toMatchObject({ approvedMark: "DONE" });
  });

  it("requires DONE ledger entries to name local work", () => {
    expect(() =>
      ReviewLedgerEntrySchema.parse({
        commitId: "commit-1",
        upstreamSha: "1234567",
        finalMark: "DONE",
        concernAreas: ["tool-affordances"],
        localChangeRefs: [],
        approvedBy: human,
        approvedAt: now,
      }),
    ).toThrow();
  });

  it("requires resolved threaded comments to carry resolution metadata", () => {
    expect(() =>
      ThreadedCommentSchema.parse({
        id: "comment-1",
        scope: { type: "commit", commitId: "commit-1" },
        anchor: { kind: "scope" },
        threadId: "thread-1",
        parentCommentId: null,
        bodyMarkdown: "Needs a closer look.",
        state: "resolved",
        author: agent,
        createdAt: now,
      }),
    ).toThrow();
  });

  it("describes canonical schema fields directly on the Zod schemas", () => {
    expect(ConcernAreaSchema.description).toContain("canonical concern area");
    expect(ConcernAreaSchema.shape.slug.description).toContain("Stable concern area slug");
    expect(ReviewBootstrapResponseSchema.shape.reviewMarks.description).toContain("Canonical review marks");
    expect(LocalChangeRefSchema.shape.sha.description).toContain("Local commit SHA");
    expect(Object.keys(reviewSchemas)).toContain("ReviewCommit");
  });
});
