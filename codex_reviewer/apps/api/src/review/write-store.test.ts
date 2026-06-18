import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "../db/client.js";
import { migrateDatabase } from "../db/migrate.js";
import {
  commitConcernAreas,
  localChangeRefs,
  reviewCommits,
  reviewEventNewConcernAreas,
  reviewEventPreviousConcernAreas,
  reviewEvents,
  reviewFiles,
  reviewLedgerEntries,
  reviewLedgerEntryConcernAreas,
  reviewLedgerEntryLocalChangeRefs,
  reviewLedgers,
  reviewNoteRevisions,
  reviewNotes,
  reviewPlans,
  threadedComments,
  reviewVersions,
} from "../db/schema/index.js";
import { createReviewWriteStore } from "./write-store.js";

const now = "2026-06-17T12:00:00.000Z";
const tempDirectories: string[] = [];

const agent = {
  type: "agent",
  id: "agent-1",
  displayName: "Review agent",
} as const;

const human = {
  type: "human",
  id: "human-1",
  displayName: "Human reviewer",
} as const;

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("review write store", () => {
  it("parses command intent before lowering a commit mark change into rows", async () => {
    const connection = await seededConnection();
    const writeStore = createReviewWriteStore(connection.db);

    await writeStore.setCommitReviewMark({
      commandId: "command-1",
      actor: agent,
      occurredAt: now,
      commitId: "commit-1",
      reviewMark: "DONE",
      localChangeRefs: [
        {
          id: "local-change-1",
          sha: "1234567",
          title: "Preserve local tool behavior",
          linkedBy: agent,
          linkedAt: now,
        },
      ],
      eventId: "event-1",
    });

    await expect(
      writeStore.setCommitReviewMark({
        commandId: "command-2",
        actor: agent,
        occurredAt: now,
        commitId: "commit-1",
        reviewMark: "PASS",
        localChangeRefs: [
          {
            id: "local-change-invalid",
            sha: "7654321",
            linkedBy: agent,
            linkedAt: now,
          },
        ],
        eventId: "event-invalid",
      }),
    ).rejects.toThrow();

    expect(await connection.db.select().from(reviewCommits)).toEqual([
      expect.objectContaining({ id: "commit-1", reviewMark: "DONE", updatedAt: now }),
    ]);
    expect(await connection.db.select().from(localChangeRefs)).toEqual([
      expect.objectContaining({
        id: "local-change-1",
        commitId: "commit-1",
        fileId: null,
        sha: "1234567",
      }),
    ]);
    expect(await connection.db.select().from(reviewEvents)).toEqual([
      expect.objectContaining({
        id: "event-1",
        scopeType: "commit",
        commitId: "commit-1",
        kind: "reviewMarkChanged",
        previousReviewMark: "FLAG",
        newReviewMark: "DONE",
      }),
    ]);
  });

  it("records ordered concern-area history through the command boundary", async () => {
    const connection = await seededConnection();
    const writeStore = createReviewWriteStore(connection.db);

    await connection.db.insert(commitConcernAreas).values([
      { commitId: "commit-1", concernAreaSlug: "tool-affordances", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "harness-prompts", position: 1 },
    ]);

    await writeStore.setCommitConcernAreas({
      commandId: "command-1",
      actor: agent,
      occurredAt: now,
      commitId: "commit-1",
      concernAreas: ["hidden-context", "message-roles"],
      eventId: "event-1",
    });

    expect(await connection.db.select().from(commitConcernAreas)).toEqual([
      { commitId: "commit-1", concernAreaSlug: "hidden-context", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "message-roles", position: 1 },
    ]);
    expect(await connection.db.select().from(reviewEventPreviousConcernAreas)).toEqual([
      { reviewEventId: "event-1", concernAreaSlug: "tool-affordances", position: 0 },
      { reviewEventId: "event-1", concernAreaSlug: "harness-prompts", position: 1 },
    ]);
    expect(await connection.db.select().from(reviewEventNewConcernAreas)).toEqual([
      { reviewEventId: "event-1", concernAreaSlug: "hidden-context", position: 0 },
      { reviewEventId: "event-1", concernAreaSlug: "message-roles", position: 1 },
    ]);
  });

  it("adds, updates, and soft-deletes review notes with revision rows", async () => {
    const connection = await seededConnection();
    const writeStore = createReviewWriteStore(connection.db);

    await writeStore.addReviewNote({
      commandId: "command-create-note",
      actor: agent,
      occurredAt: now,
      noteId: "note-1",
      scope: { type: "commit", commitId: "commit-1" },
      bodyMarkdown: "Initial rationale.",
    });
    await writeStore.updateReviewNote({
      commandId: "command-update-note",
      actor: agent,
      occurredAt: "2026-06-17T12:05:00.000Z",
      noteId: "note-1",
      bodyMarkdown: "Clarified rationale.",
    });
    await writeStore.deleteReviewNote({
      commandId: "command-delete-note",
      actor: agent,
      occurredAt: "2026-06-17T12:10:00.000Z",
      noteId: "note-1",
    });

    await expect(
      writeStore.updateReviewNote({
        commandId: "command-update-deleted-note",
        actor: agent,
        occurredAt: "2026-06-17T12:11:00.000Z",
        noteId: "note-1",
        bodyMarkdown: "This should not write.",
      }),
    ).rejects.toThrow();

    expect(await connection.db.select().from(reviewNotes)).toEqual([
      expect.objectContaining({
        id: "note-1",
        scopeType: "commit",
        commitId: "commit-1",
        bodyMarkdown: "Clarified rationale.",
        deletedAt: "2026-06-17T12:10:00.000Z",
        deletedById: "agent-1",
      }),
    ]);
    expect(await connection.db.select().from(reviewNoteRevisions)).toEqual([
      expect.objectContaining({
        id: "command-create-note",
        changeKind: "created",
        bodyMarkdownBefore: null,
        bodyMarkdownAfter: "Initial rationale.",
      }),
      expect.objectContaining({
        id: "command-update-note",
        changeKind: "updated",
        bodyMarkdownBefore: "Initial rationale.",
        bodyMarkdownAfter: "Clarified rationale.",
      }),
      expect.objectContaining({
        id: "command-delete-note",
        changeKind: "deleted",
        bodyMarkdownBefore: "Clarified rationale.",
        bodyMarkdownAfter: null,
      }),
    ]);
  });

  it("writes threaded comments and plan updates through command schemas", async () => {
    const connection = await seededConnection();
    const writeStore = createReviewWriteStore(connection.db);

    await writeStore.addThreadedComment({
      commandId: "command-comment",
      actor: agent,
      occurredAt: now,
      commentId: "comment-1",
      scope: { type: "file", fileId: "file-1" },
      anchor: {
        kind: "range",
        fileId: "file-1",
        side: "new",
        startLine: 12,
        endLine: 12,
        selectedText: "prompt",
      },
      threadId: "thread-1",
      parentCommentId: null,
      bodyMarkdown: "Confirm this changed prompt behavior.",
    });
    await writeStore.resolveThreadedComment({
      commandId: "command-resolve-comment",
      actor: agent,
      occurredAt: "2026-06-17T12:05:00.000Z",
      commentId: "comment-1",
      threadId: "thread-1",
      scope: { type: "file", fileId: "file-1" },
      eventId: "event-resolve-comment",
    });
    await writeStore.upsertReviewPlan({
      commandId: "command-plan",
      actor: agent,
      occurredAt: now,
      reviewPlanId: "plan-1",
      scope: { type: "commit", commitId: "commit-1" },
      bodyMarkdown: "1. Inspect prompt behavior.",
      eventId: "event-plan",
    });

    expect(await connection.db.select().from(threadedComments)).toEqual([
      expect.objectContaining({
        id: "comment-1",
        scopeType: "file",
        fileId: "file-1",
        anchorKind: "range",
        anchorFileId: "file-1",
        state: "resolved",
        resolvedById: "agent-1",
      }),
    ]);
    expect(await connection.db.select().from(reviewPlans)).toEqual([
      expect.objectContaining({
        id: "plan-1",
        scopeType: "commit",
        commitId: "commit-1",
        bodyMarkdown: "1. Inspect prompt behavior.",
      }),
    ]);
    expect(await connection.db.select().from(reviewEvents)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "event-resolve-comment",
          kind: "commentResolved",
          commentId: "comment-1",
        }),
        expect.objectContaining({
          id: "event-plan",
          kind: "planUpdated",
          reviewPlanId: "plan-1",
        }),
      ]),
    );
  });

  it("generates completed review ledgers through a human command", async () => {
    const connection = await seededConnection();
    const writeStore = createReviewWriteStore(connection.db);

    await connection.db.insert(localChangeRefs).values({
      id: "local-change-1",
      commitId: "commit-1",
      sha: "1234567",
      linkedByType: "human",
      linkedById: "human-1",
      linkedAt: now,
    });

    await writeStore.generateReviewLedger({
      commandId: "command-ledger",
      actor: human,
      occurredAt: "2026-06-17T12:30:00.000Z",
      ledgerId: "ledger-1",
      versionId: "version-1",
      summary: "Completed review.",
      entries: [
        {
          ledgerEntryId: "ledger-entry-1",
          commitId: "commit-1",
          upstreamSha: "abcdef1",
          finalMark: "DONE",
          concernAreas: ["tool-affordances"],
          localChangeRefIds: ["local-change-1"],
          approvedBy: human,
          approvedAt: "2026-06-17T12:20:00.000Z",
        },
      ],
    });

    await expect(
      writeStore.generateReviewLedger({
        commandId: "command-ledger-agent",
        actor: agent,
        occurredAt: "2026-06-17T12:31:00.000Z",
        ledgerId: "ledger-2",
        versionId: "version-1",
        entries: [],
      }),
    ).rejects.toThrow();

    expect(await connection.db.select().from(reviewLedgers)).toEqual([
      expect.objectContaining({
        id: "ledger-1",
        versionId: "version-1",
        generatedById: "human-1",
        generatedAt: "2026-06-17T12:30:00.000Z",
      }),
    ]);
    expect(await connection.db.select().from(reviewLedgerEntries)).toEqual([
      expect.objectContaining({
        id: "ledger-entry-1",
        ledgerId: "ledger-1",
        finalMark: "DONE",
        requiredLocalChangeRefId: "local-change-1",
      }),
    ]);
    expect(await connection.db.select().from(reviewLedgerEntryConcernAreas)).toEqual([
      { ledgerEntryId: "ledger-entry-1", concernAreaSlug: "tool-affordances", position: 0 },
    ]);
    expect(await connection.db.select().from(reviewLedgerEntryLocalChangeRefs)).toEqual([
      { ledgerEntryId: "ledger-entry-1", localChangeRefId: "local-change-1" },
    ]);
  });
});

async function seededConnection(): Promise<ReviewDatabaseConnection> {
  const connection = await migratedConnection();
  await connection.db.insert(reviewVersions).values({
    id: "version-1",
    label: "Upstream review",
    repositoryId: "codex",
    createdAt: now,
  });
  await connection.db.insert(reviewCommits).values({
    id: "commit-1",
    versionId: "version-1",
    sha: "abcdef1",
    position: 0,
    title: "Adjust tool prompts",
    reviewMark: "FLAG",
    createdAt: now,
  });
  await connection.db.insert(reviewFiles).values({
    id: "file-1",
    commitId: "commit-1",
    position: 0,
    path: "codex-rs/core/src/prompt.rs",
    changeKind: "modified",
    reviewMark: "FLAG",
    createdAt: now,
  });
  return connection;
}

async function migratedConnection(): Promise<ReviewDatabaseConnection> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-write-store-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "test.sqlite")}`);
  await migrateDatabase(connection.client);
  return connection;
}
