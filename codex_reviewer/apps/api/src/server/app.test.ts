import { concernAreas, reviewMarkDefinitions } from "@prompt-reviews/contracts";
import { describe, expect, it, vi } from "vitest";
import { createApiApp } from "./app.js";
import type { ApiDependencies } from "./types.js";

describe("createApiApp", () => {
  it("serves health through the shared response contract", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "codex-reviewer-api" });
  });

  it("returns metadata through the shared response contract", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/meta");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      appName: "Codex Reviewer",
      apiName: "codex-reviewer-api",
      contractsPackage: "@prompt-reviews/contracts",
      status: "ready",
      summary: "Contracts-first Hono and React workspace foundation.",
    });
  });

  it("rejects invalid query params through Hono and Zod", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/meta?view=everything");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "validation_failed",
        message: "Invalid API payload.",
      },
    });
  });

  it("serves review bootstrap data from shared contracts", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/review/bootstrap");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      concernAreas,
      reviewMarks: reviewMarkDefinitions,
      schemaNames: expect.arrayContaining([
        "ConcernArea",
        "ReviewCommitRead",
        "ReviewCommitRow",
        "ReviewMark",
      ]),
    });
  });

  it("serves concern areas from the canonical registry", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/review/concern-areas");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ concernAreas });
  });

  it("serves review mark workflow metadata from the canonical registry", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/review/marks");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reviewMarks: reviewMarkDefinitions });
  });

  it("serves the review schema catalog", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/review/schemas");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      schemaNames: expect.arrayContaining([
        "AgentReviewRead",
        "HumanApprovalRead",
        "ReviewLedgerRead",
        "ReviewNoteRow",
      ]),
    });
  });

  it("accepts review note writes only through the canonical command shape", async () => {
    const dependencies = testDependencies();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-1",
        actor: { type: "agent", id: "agent-1" },
        occurredAt: "2026-06-17T12:00:00.000Z",
        noteId: "note-1",
        scope: { type: "commit", commitId: "commit-1" },
        bodyMarkdown: "Track this review rationale.",
      }),
    });

    expect(response.status).toBe(204);
    expect(dependencies.reviewWriteStore.addReviewNote).toHaveBeenCalledWith({
      commandId: "command-1",
      actor: { type: "agent", id: "agent-1" },
      occurredAt: "2026-06-17T12:00:00.000Z",
      noteId: "note-1",
      scope: { type: "commit", commitId: "commit-1" },
      bodyMarkdown: "Track this review rationale.",
    });

    const invalidResponse = await app.request("/api/review/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-2",
        actor: { type: "agent", id: "agent-1" },
        occurredAt: "2026-06-17T12:00:00.000Z",
        noteId: "note-2",
        scope: { type: "version", versionId: "version-1" },
        bodyMarkdown: "This is not a valid ReviewNote scope.",
      }),
    });

    expect(invalidResponse.status).toBe(400);
    expect(dependencies.reviewWriteStore.addReviewNote).toHaveBeenCalledTimes(1);
  });

  it("routes threaded comments and review plans through command-shaped writes", async () => {
    const dependencies = testDependencies();
    const app = createApiApp(dependencies);

    const commentResponse = await app.request("/api/review/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-comment",
        actor: { type: "agent", id: "agent-1" },
        occurredAt: "2026-06-17T12:00:00.000Z",
        commentId: "comment-1",
        scope: { type: "file", fileId: "file-1" },
        anchor: { kind: "scope" },
        threadId: "thread-1",
        parentCommentId: null,
        bodyMarkdown: "Investigate this file change.",
      }),
    });
    const resolveResponse = await app.request("/api/review/comments/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-resolve-comment",
        actor: { type: "agent", id: "agent-1" },
        occurredAt: "2026-06-17T12:05:00.000Z",
        commentId: "comment-1",
        threadId: "thread-1",
        scope: { type: "file", fileId: "file-1" },
        eventId: "event-resolve-comment",
      }),
    });
    const planResponse = await app.request("/api/review/plans", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-plan",
        actor: { type: "agent", id: "agent-1" },
        occurredAt: "2026-06-17T12:10:00.000Z",
        reviewPlanId: "plan-1",
        scope: { type: "commit", commitId: "commit-1" },
        bodyMarkdown: "1. Verify the prompt behavior.",
        eventId: "event-plan",
      }),
    });

    expect(commentResponse.status).toBe(204);
    expect(resolveResponse.status).toBe(204);
    expect(planResponse.status).toBe(204);
    expect(dependencies.reviewWriteStore.addThreadedComment).toHaveBeenCalledTimes(1);
    expect(dependencies.reviewWriteStore.resolveThreadedComment).toHaveBeenCalledTimes(1);
    expect(dependencies.reviewWriteStore.upsertReviewPlan).toHaveBeenCalledTimes(1);
  });

  it("routes completed review ledger generation through a human command", async () => {
    const dependencies = testDependencies();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/ledgers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-ledger",
        actor: { type: "human", id: "human-1" },
        occurredAt: "2026-06-17T12:15:00.000Z",
        ledgerId: "ledger-1",
        versionId: "version-1",
        entries: [
          {
            ledgerEntryId: "ledger-entry-1",
            commitId: "commit-1",
            upstreamSha: "abcdef1",
            finalMark: "PASS",
            concernAreas: ["tool-affordances"],
            localChangeRefIds: [],
            approvedBy: { type: "human", id: "human-1" },
            approvedAt: "2026-06-17T12:10:00.000Z",
          },
        ],
      }),
    });
    const agentResponse = await app.request("/api/review/ledgers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commandId: "command-ledger-agent",
        actor: { type: "agent", id: "agent-1" },
        occurredAt: "2026-06-17T12:15:00.000Z",
        ledgerId: "ledger-2",
        versionId: "version-1",
        entries: [],
      }),
    });

    expect(response.status).toBe(204);
    expect(agentResponse.status).toBe(400);
    expect(dependencies.reviewWriteStore.generateReviewLedger).toHaveBeenCalledTimes(1);
  });

  it("returns contract-shaped errors", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "not_found",
        message: "Not Found",
      },
    });
  });
});

function testDependencies(): ApiDependencies {
  return {
    config: {
      host: "127.0.0.1",
      port: 0,
    },
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    } as unknown as ApiDependencies["logger"],
    reviewWriteStore: {
      setCommitReviewMark: vi.fn(),
      setFileReviewMark: vi.fn(),
      setCommitConcernAreas: vi.fn(),
      recordAgentReview: vi.fn(),
      recordHumanApproval: vi.fn(),
      linkLocalChangeRef: vi.fn(),
      addThreadedComment: vi.fn(),
      resolveThreadedComment: vi.fn(),
      addReviewNote: vi.fn(),
      updateReviewNote: vi.fn(),
      deleteReviewNote: vi.fn(),
      upsertReviewPlan: vi.fn(),
      generateReviewLedger: vi.fn(),
    },
  };
}
