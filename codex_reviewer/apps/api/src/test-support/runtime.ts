import { join } from "node:path";
import { reviewTestNow, reviewTestRange } from "@prompt-reviews/review-test-support";
import { vi } from "vitest";
import type { ReviewDatabaseConnection } from "../db/client.js";
import { createAgentReviewStore } from "../review/agent-review-store.js";
import type { GitRangeReader } from "../review/git-range-reader.js";
import { createReviewIngestService } from "../review/ingest-service.js";
import { createReviewReadStore } from "../review/read-store.js";
import { createReviewWriteStore } from "../review/write-store.js";
import type { ApiDependencies } from "../server/types.js";
import { migratedTestConnection } from "./db.js";

export async function createTestRuntime(options: { gitRangeReader?: GitRangeReader } = {}): Promise<{
  connection: ReviewDatabaseConnection;
  dependencies: ApiDependencies;
}> {
  const connection = await migratedTestConnection();
  const reviewReadStore = createReviewReadStore(connection.db);

  return {
    connection,
    dependencies: {
      config: {
        databaseUrl: "file::memory:",
        host: "127.0.0.1",
        port: 0,
      },
      logger: {
        error: vi.fn(),
        info: vi.fn(),
      } as unknown as ApiDependencies["logger"],
      agentReviewStore: createAgentReviewStore(connection.db, reviewReadStore),
      reviewIngestService: createReviewIngestService(connection.db, reviewReadStore, {
        gitRangeReader: options.gitRangeReader ?? fakeGitRangeReader(),
      }),
      reviewReadStore,
      reviewWriteStore: createReviewWriteStore(connection.db, reviewReadStore),
    },
  };
}

export function fakeGitRangeReader(): GitRangeReader {
  return {
    async resolveCommit(refOrSha) {
      return (
        {
          [reviewTestRange.baseRef]: reviewTestRange.baseSha,
          [reviewTestRange.targetRef]: reviewTestRange.targetSha,
        }[refOrSha] ?? null
      );
    },
    async listCommits() {
      return [
        {
          sha: reviewTestRange.targetSha,
          title: "Adjust prompt text",
          message: null,
          authorName: "OpenAI",
          committedAt: reviewTestNow,
          files: [
            {
              path: "codex-rs/core/src/prompt.rs",
              oldPath: null,
              changeKind: "modified",
              patch: [
                "diff --git a/codex-rs/core/src/prompt.rs b/codex-rs/core/src/prompt.rs",
                "--- a/codex-rs/core/src/prompt.rs",
                "+++ b/codex-rs/core/src/prompt.rs",
                "@@ -1 +1 @@ prompt",
                "-old",
                "+new",
              ].join("\n"),
            },
          ],
        },
      ];
    },
  };
}

export function sqliteFileUrlForDirectory(directory: string): string {
  return `file:${join(directory, "review.db")}`;
}
