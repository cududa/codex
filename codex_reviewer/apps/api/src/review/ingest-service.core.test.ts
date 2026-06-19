import { asc } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  diffBlocks,
  reviewCommits,
  reviewFiles,
  reviewVersionIngests,
  reviewVersions,
} from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import {
  createReviewIngestTestService,
  fixtureGitRangeReader,
  ingestBaseSha,
  ingestTargetSha,
} from "./ingest-service.test-support.js";
import { deterministicConcernMapVersion } from "./ingest-service.js";

afterEach(cleanupTestDatabases);

describe("review ingest service core writes", () => {
  it("creates the initialized durable review spine and normal read composition", async () => {
    const connection = await migratedTestConnection();
    const store = createReviewIngestTestService(connection, fixtureGitRangeReader());

    const response = await store.ingestReviewVersion({
      repositoryId: "openai/codex",
      baseRefOrSha: "local-main",
      targetRefOrSha: "upstream/main",
      source: "system-ingest",
      concernMapVersion: deterministicConcernMapVersion,
    });

    expect(response.created).toBe(true);
    expect(response.version).toMatchObject({
      label: "openai/codex 1111111..9999999",
      repositoryId: "openai/codex",
      baseRef: "local-main",
      targetRef: "upstream/main",
      baseSha: ingestBaseSha,
      targetSha: ingestTargetSha,
      commitCount: 2,
      commits: [
        {
          sha: "2222222",
          position: 0,
          reviewMark: "FLAG",
          concernAreas: ["harness-prompts", "message-roles", "hidden-context"],
          files: [
            {
              path: "codex-rs/core/src/prompt.rs",
              position: 0,
              reviewMark: null,
              diffBlocks: [
                { position: 0, heading: "prompt one", oldStartLine: 1, oldEndLine: 2 },
                { position: 1, heading: "prompt two", oldStartLine: null, newStartLine: 10 },
              ],
            },
            {
              path: "codex-rs/core/src/sandbox.rs",
              position: 1,
              reviewMark: null,
              diffBlocks: [{ position: 0, heading: "sandbox" }],
            },
          ],
        },
        {
          sha: "3333333",
          position: 1,
          reviewMark: "PASS",
          concernAreas: [],
          files: [
            {
              path: "docs/readme.md",
              reviewMark: null,
            },
          ],
        },
      ],
    });

    await expect(connection.db.select().from(reviewVersions)).resolves.toMatchObject([
      {
        repositoryId: "openai/codex",
        baseRef: "local-main",
        targetRef: "upstream/main",
        baseSha: ingestBaseSha,
        targetSha: ingestTargetSha,
      },
    ]);
    await expect(connection.db.select().from(reviewVersionIngests)).resolves.toMatchObject([
      {
        repositoryId: "openai/codex",
        baseRefOrSha: "local-main",
        targetRefOrSha: "upstream/main",
        baseSha: ingestBaseSha,
        targetSha: ingestTargetSha,
        concernMapVersion: deterministicConcernMapVersion,
        source: "system-ingest",
      },
    ]);
    await expect(
      connection.db.select().from(reviewCommits).orderBy(asc(reviewCommits.position)),
    ).resolves.toMatchObject([
      { sha: "2222222", position: 0, reviewMark: "FLAG" },
      { sha: "3333333", position: 1, reviewMark: "PASS" },
    ]);
    const fileRows = await connection.db.select().from(reviewFiles);
    expect(
      fileRows.map((row) => ({ path: row.path, position: row.position, reviewMark: row.reviewMark })),
    ).toEqual(
      expect.arrayContaining([
        { path: "codex-rs/core/src/prompt.rs", position: 0, reviewMark: null },
        { path: "codex-rs/core/src/sandbox.rs", position: 1, reviewMark: null },
        { path: "docs/readme.md", position: 0, reviewMark: null },
      ]),
    );
    await expect(
      connection.db.select().from(diffBlocks).orderBy(asc(diffBlocks.fileId), asc(diffBlocks.position)),
    ).resolves.toHaveLength(4);
  });
});
