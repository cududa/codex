import { describe, expect, it } from "vitest";
import {
  AgentReviewReadSchema,
  ConcernAreaSchema,
  ConcernAreaSelectionSchema,
  DetectorEvidenceRowSchema,
  DetectorEvidenceReadSchema,
  DetectorRunReadSchema,
  GenerateReviewLedgerCommandSchema,
  HumanApprovalReadSchema,
  LocalChangeRefReadSchema,
  AddReviewNoteCommandSchema,
  ReviewBootstrapResponseSchema,
  ReviewCommitReadSchema,
  ReviewCommitRowSchema,
  ReviewEventReadSchema,
  ReviewEventRowSchema,
  ReviewFileReadSchema,
  ReviewLedgerEntryReadSchema,
  ReviewLedgerReadSchema,
  ReviewNoteReadSchema,
  ReviewNoteRevisionRowSchema,
  ReviewNoteRowSchema,
  SetCommitReviewMarkCommandSchema,
  ThreadedCommentReadSchema,
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
      description:
        "Changes to tool availability, descriptions, schemas, routing, execution, or model-facing affordances.",
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
      ReviewCommitReadSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        position: 0,
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
      ReviewCommitReadSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        position: 0,
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
      ReviewFileReadSchema.parse({
        id: "file-1",
        commitId: "commit-1",
        position: 0,
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
      ReviewFileReadSchema.parse({
        id: "file-1",
        commitId: "commit-1",
        position: 0,
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
      AgentReviewReadSchema.parse({
        id: "agent-review-1",
        scope: { type: "commit", commitId: "commit-1" },
        reviewedMark: "FLAG",
        reviewer: agent,
        reviewedAt: now,
      }),
    ).toThrow();

    expect(
      AgentReviewReadSchema.parse({
        id: "agent-review-1",
        scope: { type: "commit", commitId: "commit-1" },
        reviewedMark: "FLAG",
        reviewedConcernAreas: [],
        reviewer: agent,
        reviewedAt: now,
      }),
    ).toMatchObject({ reviewedConcernAreas: [] });

    expect(() =>
      AgentReviewReadSchema.parse({
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
      HumanApprovalReadSchema.parse({
        id: "approval-1",
        scope: { type: "commit", commitId: "commit-1" },
        approvedMark: "PASS",
        localChangeRefs: [],
        approvedBy: human,
        approvedAt: now,
      }),
    ).toThrow();

    expect(() =>
      HumanApprovalReadSchema.parse({
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
      HumanApprovalReadSchema.parse({
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
      ReviewLedgerEntryReadSchema.parse({
        commitId: "commit-1",
        upstreamSha: "1234567",
        finalMark: "DONE",
        concernAreas: ["tool-affordances"],
        localChangeRefs: [],
        approvedBy: human,
        approvedAt: now,
      }),
    ).toThrow();

    expect(
      ReviewLedgerReadSchema.parse({
        id: "ledger-1",
        versionId: "version-1",
        generatedAt: now,
        generatedBy: human,
        entries: [
          {
            commitId: "commit-1",
            upstreamSha: "1234567",
            finalMark: "PASS",
            concernAreas: ["tool-affordances"],
            localChangeRefs: [],
            approvedBy: human,
            approvedAt: now,
          },
        ],
      }),
    ).toMatchObject({ id: "ledger-1", versionId: "version-1" });

    expect(() =>
      GenerateReviewLedgerCommandSchema.parse({
        commandId: "command-ledger",
        actor: agent,
        occurredAt: now,
        ledgerId: "ledger-1",
        versionId: "version-1",
        entries: [],
      }),
    ).toThrow();
  });

  it("models detector evidence as typed canonical state", () => {
    expect(
      DetectorRunReadSchema.parse({
        id: "detector-run-1",
        versionId: "version-1",
        concernMapVersion: 1,
        state: "completed",
        startedAt: now,
        completedAt: now,
      }),
    ).toMatchObject({ state: "completed" });

    expect(
      DetectorEvidenceReadSchema.parse({
        id: "detector-evidence-1",
        runId: "detector-run-1",
        scope: { type: "commit", commitId: "commit-1" },
        concernArea: "tool-affordances",
        suggestedReviewMark: "FLAG",
        title: "Tool schema changed",
        detail: {
          kind: "symbol",
          path: "codex-rs/core/src/tool.rs",
          symbolName: "ToolCall",
        },
        createdAt: now,
      }),
    ).toMatchObject({
      concernArea: "tool-affordances",
      detail: { kind: "symbol" },
    });

    expect(() =>
      DetectorEvidenceReadSchema.parse({
        id: "detector-evidence-1",
        runId: "detector-run-1",
        scope: { type: "commit", commitId: "commit-1" },
        concernArea: "tool-affordances",
        title: "Malformed diff evidence",
        detail: {
          kind: "diff",
          diffBlockId: "diff-block-1",
          startLine: 20,
          endLine: 10,
        },
        createdAt: now,
      }),
    ).toThrow();
  });

  it("uses typed review events instead of payload blobs", () => {
    expect(
      ReviewEventReadSchema.parse({
        id: "event-1",
        kind: "reviewMarkChanged",
        scope: { type: "file", fileId: "file-1" },
        previousReviewMark: null,
        newReviewMark: "FLAG",
        actor: agent,
        summary: "Detector marked the file for investigation.",
        createdAt: now,
      }),
    ).toMatchObject({
      kind: "reviewMarkChanged",
      previousReviewMark: null,
      newReviewMark: "FLAG",
    });

    expect(() =>
      ReviewEventReadSchema.parse({
        id: "event-1",
        kind: "reviewMarkChanged",
        scope: { type: "file", fileId: "file-1" },
        previousReviewMark: null,
        newReviewMark: "FLAG",
        actor: agent,
        summary: "No loose JSON.",
        payload: { costume: "jewelry" },
        createdAt: now,
      }),
    ).toThrow();
  });

  it("keeps command schemas as canonical write intent", () => {
    expect(
      SetCommitReviewMarkCommandSchema.parse({
        commandId: "command-1",
        actor: agent,
        occurredAt: now,
        commitId: "commit-1",
        reviewMark: "FLAG",
        localChangeRefs: [],
        eventId: "event-1",
      }),
    ).toMatchObject({ reviewMark: "FLAG" });

    expect(() =>
      SetCommitReviewMarkCommandSchema.parse({
        commandId: "command-1",
        actor: agent,
        occurredAt: now,
        commitId: "commit-1",
        reviewMark: "DONE",
        localChangeRefs: [],
        eventId: "event-1",
      }),
    ).toThrow();

    expect(() =>
      SetCommitReviewMarkCommandSchema.parse({
        commandId: "command-1",
        actor: agent,
        occurredAt: now,
        commitId: "commit-1",
        reviewMark: "PASS",
        localChangeRefs: [localChangeRef],
        eventId: "event-1",
      }),
    ).toThrow();
  });

  it("keeps stored row schemas honest about table shape", () => {
    expect(
      ReviewCommitRowSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        position: 0,
        title: "Adjust tool prompt",
        message: null,
        authorName: null,
        committedAt: null,
        reviewMark: "FLAG",
        createdAt: now,
        updatedAt: null,
      }),
    ).toMatchObject({ message: null, reviewMark: "FLAG" });

    expect(() =>
      ReviewCommitRowSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        position: 0,
        title: "Adjust tool prompt",
        message: null,
        authorName: null,
        committedAt: null,
        reviewMark: "FLAG",
        fileCount: 1,
        createdAt: now,
        updatedAt: null,
      }),
    ).toThrow();

    expect(() =>
      ReviewEventRowSchema.parse({
        id: "event-1",
        scopeType: "file",
        versionId: null,
        commitId: "commit-1",
        fileId: null,
        diffBlockId: null,
        kind: "concernAreasChanged",
        actorType: "agent",
        actorId: "agent-1",
        actorDisplayName: "Review agent",
        summary: "Impossible scope target.",
        previousReviewMark: null,
        newReviewMark: null,
        agentReviewId: null,
        humanApprovalId: null,
        approvedMark: null,
        localChangeRefId: null,
        localChangeSha: null,
        commentId: null,
        threadId: null,
        reviewPlanId: null,
        createdAt: now,
      }),
    ).toThrow();
  });

  it("keeps detector row schemas honest about normalized evidence storage", () => {
    expect(
      DetectorEvidenceRowSchema.parse({
        id: "evidence-1",
        runId: "detector-run-1",
        scopeType: "commit",
        versionId: null,
        commitId: "commit-1",
        fileId: null,
        diffBlockId: null,
        concernAreaSlug: "tool-affordances",
        suggestedReviewMark: "FLAG",
        title: "Tool schema changed",
        summary: null,
        detailKind: "symbol",
        detailPath: "codex-rs/core/src/tool.rs",
        detailSymbolName: "ToolCall",
        detailMarker: null,
        detailDiffBlockId: null,
        detailSide: null,
        detailStartLine: null,
        detailEndLine: null,
        detailGraphNodeId: null,
        detailGraphNodeLabel: null,
        createdAt: now,
      }),
    ).toMatchObject({ detailKind: "symbol" });

    expect(() =>
      DetectorEvidenceRowSchema.parse({
        id: "evidence-1",
        runId: "detector-run-1",
        scopeType: "commit",
        versionId: null,
        commitId: "commit-1",
        fileId: null,
        diffBlockId: null,
        concernAreaSlug: "tool-affordances",
        suggestedReviewMark: "FLAG",
        title: "Tool schema changed",
        summary: null,
        detailKind: "symbol",
        detailPath: null,
        detailSymbolName: null,
        detailMarker: null,
        detailDiffBlockId: null,
        detailSide: null,
        detailStartLine: null,
        detailEndLine: null,
        detailGraphNodeId: null,
        detailGraphNodeLabel: null,
        createdAt: now,
      }),
    ).toThrow();
  });

  it("requires resolved threaded comments to carry resolution metadata", () => {
    expect(() =>
      ThreadedCommentReadSchema.parse({
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

  it("models review notes as scoped markdown artifacts with soft-delete history", () => {
    expect(
      AddReviewNoteCommandSchema.parse({
        commandId: "command-1",
        actor: agent,
        occurredAt: now,
        noteId: "note-1",
        scope: { type: "diffBlock", diffBlockId: "diff-block-1" },
        bodyMarkdown: "This rationale belongs near the diff.",
      }),
    ).toEqual({
      commandId: "command-1",
      actor: agent,
      occurredAt: now,
      noteId: "note-1",
      scope: { type: "diffBlock", diffBlockId: "diff-block-1" },
      bodyMarkdown: "This rationale belongs near the diff.",
    });
    expect(() =>
      AddReviewNoteCommandSchema.parse({
        commandId: "command-1",
        actor: agent,
        occurredAt: now,
        noteId: "note-1",
        scope: { type: "version", versionId: "version-1" },
        bodyMarkdown: "Version notes are not part of ReviewNote.",
      }),
    ).toThrow();
    expect(
      ReviewNoteReadSchema.parse({
        id: "note-1",
        scope: { type: "commit", commitId: "commit-1" },
        bodyMarkdown: "Carry this investigation context forward.",
        author: human,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        deletedBy: null,
      }),
    ).toMatchObject({ id: "note-1", deletedAt: null });
    expect(() =>
      ReviewNoteReadSchema.parse({
        id: "note-1",
        scope: { type: "commit", commitId: "commit-1" },
        bodyMarkdown: "Bad soft-delete shape.",
        author: human,
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
        deletedBy: null,
      }),
    ).toThrow();
    expect(() =>
      ReviewNoteRowSchema.parse({
        id: "note-1",
        scopeType: "commit",
        commitId: null,
        fileId: "file-1",
        diffBlockId: null,
        bodyMarkdown: "Scope mismatch.",
        authorType: "agent",
        authorId: "agent-1",
        authorDisplayName: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        deletedByType: null,
        deletedById: null,
        deletedByDisplayName: null,
      }),
    ).toThrow();
    expect(() =>
      ReviewNoteRevisionRowSchema.parse({
        id: "command-1",
        noteId: "note-1",
        actorType: "human",
        actorId: "human-1",
        actorDisplayName: null,
        changedAt: now,
        action: "deleted",
        bodyMarkdownBefore: null,
        bodyMarkdownAfter: null,
      }),
    ).toThrow();
  });

  it("describes canonical schema fields directly on the Zod schemas", () => {
    expect(ConcernAreaSchema.description).toContain("canonical concern area");
    expect(ConcernAreaSchema.shape.slug.description).toContain("Stable concern area slug");
    expect(ReviewBootstrapResponseSchema.shape.reviewMarks.description).toContain("Canonical review marks");
    expect(LocalChangeRefReadSchema.shape.sha.description).toContain("Local commit SHA");
    expect(Object.keys(reviewSchemas)).toContain("ReviewCommitRead");
    expect(Object.keys(reviewSchemas)).toContain("ReviewCommitRow");
    expect(Object.keys(reviewSchemas)).toContain("ReviewNoteRow");
    expect(Object.keys(reviewSchemas)).toContain("AddReviewNoteCommand");
    expect(Object.keys(reviewSchemas)).toContain("GenerateReviewLedgerCommand");
    expect(Object.keys(reviewSchemas)).toContain("SetCommitReviewMarkCommand");
    expect(Object.keys(reviewSchemas).join(" ")).not.toContain("Decision");
    expect(Object.keys(reviewSchemas).join(" ")).not.toContain("Finalization");
  });
});
