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
  reviewVersions,
  threadedComments,
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
      state: "open",
      createdAt: now,
    });
    await connection.db.insert(reviewCommits).values({
      id: "commit-1",
      versionId: "version-1",
      sha: "abcdef1",
      position: 0,
      title: "Adjust tool prompts",
      reviewMark: "DONE",
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
      reviewMark: "DONE",
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
        reviewMark: "DONE",
      }),
    ]);
  });

  it("rejects file concern areas by having no table that can store them", async () => {
    const connection = await migratedConnection();

    const tables = await connection.client.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");

    expect(tables.rows.map((row) => row.name)).not.toContain("file_concern_areas");
    expect(tables.rows.map((row) => row.name)).not.toContain("agent_file_review_concern_areas");
    expect(tables.rows.map((row) => row.name)).not.toContain("human_file_approval_concern_areas");
    expect(tables.rows.map((row) => row.name)).toContain("agent_commit_review_concern_areas");
    expect(tables.rows.map((row) => row.name)).toContain("human_commit_approval_concern_areas");
  });

  it("stores review events with typed columns instead of payload JSON", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewVersions).values({
      id: "version-1",
      label: "Upstream review",
      repositoryId: "codex",
      state: "open",
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

  it("enforces scoped threaded comment invariants in the database", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewVersions).values({
      id: "version-1",
      label: "Upstream review",
      repositoryId: "codex",
      state: "open",
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
  });
});

async function migratedConnection(): Promise<ReviewDatabaseConnection> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-db-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "test.sqlite")}`);
  await migrateDatabase(connection.client);
  return connection;
}
