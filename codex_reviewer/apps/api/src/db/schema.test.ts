import {
  DetectorEvidenceRowSchema,
  ReviewCommitRowSchema,
  ReviewFileRowSchema,
  ReviewNoteRevisionRowSchema,
  ReviewNoteRowSchema,
} from "@prompt-reviews/contracts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "./client.js";
import { migrateDatabase } from "./migrate.js";
import {
  commitConcernAreas,
  detectorEvidence,
  detectorRuns,
  diffBlocks,
  humanCommitApprovals,
  localChangeRefs,
  reviewCommits,
  reviewEvents,
  reviewFiles,
  reviewLedgers,
  reviewNoteRevisions,
  reviewNotes,
  reviewVersions,
  threadedComments,
  reviewLedgerEntries,
} from "./schema/index.js";

const now = "2026-06-17T12:00:00.000Z";
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("fresh review persistence schema", () => {
  it("migrates an empty database and stores target review concepts directly", async () => {
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
    await connection.db.insert(commitConcernAreas).values([
      { commitId: "commit-1", concernAreaSlug: "tool-affordances", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "harness-prompts", position: 1 },
    ]);
    await connection.db.insert(reviewFiles).values({
      id: "file-1",
      commitId: "commit-1",
      position: 0,
      path: "codex-rs/core/src/prompt.rs",
      changeKind: "modified",
      reviewMark: "FLAG",
      createdAt: now,
    });
    await connection.db.insert(diffBlocks).values({
      id: "diff-block-1",
      fileId: "file-1",
      position: 0,
      newStartLine: 12,
      newEndLine: 18,
      patch: "@@ -1 +1 @@\n-prompt\n+better prompt",
    });
    await connection.db.insert(localChangeRefs).values({
      id: "local-change-1",
      commitId: "commit-1",
      sha: "1234567",
      linkedByType: "human",
      linkedById: "human-1",
      linkedAt: now,
    });
    await connection.db.update(reviewCommits).set({ reviewMark: "DONE", updatedAt: now });
    await connection.db.insert(detectorRuns).values({
      id: "detector-run-1",
      versionId: "version-1",
      concernMapVersion: 1,
      state: "completed",
      startedAt: now,
      completedAt: now,
    });
    await connection.db.insert(detectorEvidence).values({
      id: "detector-evidence-1",
      runId: "detector-run-1",
      scopeType: "commit",
      commitId: "commit-1",
      concernAreaSlug: "tool-affordances",
      suggestedReviewMark: "FLAG",
      title: "Tool prompt evidence",
      detailKind: "symbol",
      detailPath: "codex-rs/core/src/prompt.rs",
      detailSymbolName: "ToolPrompt",
      createdAt: now,
    });
    await connection.db.insert(humanCommitApprovals).values({
      id: "approval-1",
      commitId: "commit-1",
      approvedMark: "DONE",
      approvedById: "human-1",
      approvedAt: now,
    });

    const commits = await connection.db.select().from(reviewCommits);
    const areas = await connection.db.select().from(commitConcernAreas);
    const evidence = await connection.db.select().from(detectorEvidence);
    const files = await connection.db.select().from(reviewFiles);

    expect(ReviewCommitRowSchema.parse(commits[0])).toMatchObject({
      id: "commit-1",
      reviewMark: "DONE",
    });
    expect(DetectorEvidenceRowSchema.parse(evidence[0])).toMatchObject({
      id: "detector-evidence-1",
      detailKind: "symbol",
    });
    expect(ReviewFileRowSchema.parse(files[0])).toMatchObject({
      id: "file-1",
      reviewMark: "FLAG",
    });
    expect(commits).toEqual([
      expect.objectContaining({
        id: "commit-1",
        position: 0,
        reviewMark: "DONE",
        sha: "abcdef1",
      }),
    ]);
    expect(areas).toEqual([
      { commitId: "commit-1", concernAreaSlug: "tool-affordances", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "harness-prompts", position: 1 },
    ]);
    expect(evidence).toEqual([
      expect.objectContaining({
        id: "detector-evidence-1",
        concernAreaSlug: "tool-affordances",
        detailKind: "symbol",
      }),
    ]);
    expect(files).toEqual([
      expect.objectContaining({
        id: "file-1",
        position: 0,
        reviewMark: "FLAG",
      }),
    ]);
  });

  it("rejects file concern areas by having no table that can store them", async () => {
    const connection = await migratedConnection();

    const tables = await connection.client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );

    expect(tables.rows.map((row) => row.name)).not.toContain("file_concern_areas");
    expect(tables.rows.map((row) => row.name)).not.toContain("agent_file_review_concern_areas");
    expect(tables.rows.map((row) => row.name)).not.toContain("human_file_approval_concern_areas");
    expect(tables.rows.map((row) => row.name)).not.toContain("version_finalizations");
    expect(tables.rows.map((row) => row.name)).toContain("agent_commit_review_concern_areas");
    expect(tables.rows.map((row) => row.name)).toContain("human_commit_approval_concern_areas");
    expect(tables.rows.map((row) => row.name)).toContain("review_ledgers");
  });

  it("stores review events with typed columns instead of payload JSON", async () => {
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

    await connection.db.insert(reviewEvents).values({
      id: "event-1",
      scopeType: "commit",
      commitId: "commit-1",
      kind: "reviewMarkChanged",
      actorType: "agent",
      actorId: "agent-1",
      summary: "Detector marked the commit for investigation.",
      previousReviewMark: "PASS",
      newReviewMark: "FLAG",
      createdAt: now,
    });

    const columns = await connection.client.execute("PRAGMA table_info(review_events)");
    expect(columns.rows.map((row) => row.name)).not.toContain("payload_json");

    await expect(
      connection.db.insert(reviewEvents).values({
        id: "event-2",
        scopeType: "commit",
        commitId: "commit-1",
        kind: "reviewMarkChanged",
        actorType: "agent",
        actorId: "agent-1",
        summary: "Missing typed mark column.",
        createdAt: now,
      }),
    ).rejects.toThrow();
  });

  it("rejects DONE rows that do not have local change evidence", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewVersions).values({
      id: "version-1",
      label: "Upstream review",
      repositoryId: "codex",
      createdAt: now,
    });

    await expect(
      connection.db.insert(reviewCommits).values({
        id: "commit-1",
        versionId: "version-1",
        sha: "abcdef1",
        position: 0,
        title: "Adjust tool prompts",
        reviewMark: "DONE",
        createdAt: now,
      }),
    ).rejects.toThrow();

    await connection.db.insert(reviewCommits).values({
      id: "commit-1",
      versionId: "version-1",
      sha: "abcdef1",
      position: 0,
      title: "Adjust tool prompts",
      reviewMark: "FLAG",
      createdAt: now,
    });

    await expect(
      connection.db.update(reviewCommits).set({ reviewMark: "DONE", updatedAt: now }),
    ).rejects.toThrow();
  });

  it("rejects review event and detector variants that do not match their canonical unions", async () => {
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

    await expect(
      connection.db.insert(reviewEvents).values({
        id: "event-1",
        scopeType: "file",
        fileId: "file-1",
        kind: "concernAreasChanged",
        actorType: "agent",
        actorId: "agent-1",
        summary: "Concern areas cannot be file-scoped.",
        createdAt: now,
      }),
    ).rejects.toThrow();

    await connection.db.insert(detectorRuns).values({
      id: "detector-run-1",
      versionId: "version-1",
      concernMapVersion: 1,
      state: "completed",
      startedAt: now,
      completedAt: now,
    });

    await expect(
      connection.db.insert(detectorEvidence).values({
        id: "detector-evidence-1",
        runId: "detector-run-1",
        scopeType: "commit",
        commitId: "commit-1",
        concernAreaSlug: "tool-affordances",
        title: "Graph evidence cannot also carry path detail.",
        detailKind: "graph",
        detailPath: "codex-rs/core/src/tool.rs",
        detailGraphNodeId: "node-1",
        createdAt: now,
      }),
    ).rejects.toThrow();
  });

  it("rejects DONE ledger entries without a required local change reference", async () => {
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
    await connection.db.insert(reviewLedgers).values({
      id: "ledger-1",
      versionId: "version-1",
      generatedById: "human-1",
      generatedAt: now,
    });

    await expect(
      connection.db.insert(reviewLedgerEntries).values({
        id: "ledger-entry-1",
        ledgerId: "ledger-1",
        commitId: "commit-1",
        upstreamSha: "abcdef1",
        finalMark: "DONE",
        approvedById: "human-1",
        approvedAt: now,
      }),
    ).rejects.toThrow();
  });

  it("enforces scoped threaded comment invariants in the database", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewVersions).values({
      id: "version-1",
      label: "Upstream review",
      repositoryId: "codex",
      createdAt: now,
    });

    await expect(
      connection.db.insert(threadedComments).values({
        id: "comment-1",
        scopeType: "version",
        versionId: "version-1",
        anchorKind: "scope",
        threadId: "thread-1",
        bodyMarkdown: "Resolved without metadata.",
        state: "resolved",
        authorType: "agent",
        authorId: "agent-1",
        createdAt: now,
      }),
    ).rejects.toThrow();

    await expect(
      connection.db.insert(threadedComments).values({
        id: "comment-2",
        scopeType: "version",
        versionId: "version-1",
        anchorKind: "scope",
        selectedText: "scope anchors cannot carry selected text",
        threadId: "thread-2",
        bodyMarkdown: "Bad anchor shape.",
        authorType: "agent",
        authorId: "agent-1",
        createdAt: now,
      }),
    ).rejects.toThrow();
  });

  it("stores review notes with soft-delete state and revision history", async () => {
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

    await connection.db.insert(reviewNotes).values({
      id: "note-1",
      scopeType: "commit",
      commitId: "commit-1",
      bodyMarkdown: "Keep this rationale outside the comment thread.",
      authorType: "human",
      authorId: "human-1",
      createdAt: now,
      updatedAt: now,
    });
    await connection.db.insert(reviewNoteRevisions).values({
      id: "command-1",
      noteId: "note-1",
      actorType: "human",
      actorId: "human-1",
      changedAt: now,
      action: "created",
      bodyMarkdownBefore: null,
      bodyMarkdownAfter: "Keep this rationale outside the comment thread.",
    });

    const [note] = await connection.db.select().from(reviewNotes);
    const [revision] = await connection.db.select().from(reviewNoteRevisions);

    expect(ReviewNoteRowSchema.parse(note)).toMatchObject({
      id: "note-1",
      scopeType: "commit",
      deletedAt: null,
    });
    expect(ReviewNoteRevisionRowSchema.parse(revision)).toMatchObject({
      id: "command-1",
      action: "created",
    });
    await expect(
      connection.db.insert(reviewNotes).values({
        id: "note-invalid-version",
        scopeType: "version" as never,
        bodyMarkdown: "ReviewNote cannot attach to version scope.",
        authorType: "human",
        authorId: "human-1",
        createdAt: now,
        updatedAt: now,
      }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(reviewNoteRevisions).values({
        id: "command-invalid",
        noteId: "note-1",
        actorType: "human",
        actorId: "human-1",
        changedAt: now,
        action: "deleted",
        bodyMarkdownBefore: null,
        bodyMarkdownAfter: null,
      }),
    ).rejects.toThrow();
  });
});

async function migratedConnection(): Promise<ReviewDatabaseConnection> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-db-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "test.sqlite")}`);
  await migrateDatabase(connection.client);
  return connection;
}
