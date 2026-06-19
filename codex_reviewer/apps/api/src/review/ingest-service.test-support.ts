import { reviewTestNow } from "@prompt-reviews/review-test-support";
import type { ReviewDatabaseConnection } from "../db/client.js";
import type { GitRangeReader } from "./git-range-reader.js";
import { createReviewIngestService } from "./ingest-service.js";
import { createReviewReadStore } from "./read-store.js";

export const ingestBaseSha = "1111111";
export const ingestTargetSha = "9999999";

export function createReviewIngestTestService(
  connection: ReviewDatabaseConnection,
  gitRangeReader: GitRangeReader,
) {
  return createReviewIngestService(connection.db, createReviewReadStore(connection.db), { gitRangeReader });
}

export function fixtureGitRangeReader(): GitRangeReader {
  return {
    async resolveCommit(refOrSha) {
      return (
        {
          "base-alias": ingestBaseSha,
          "local-main": ingestBaseSha,
          "target-alias": ingestTargetSha,
          "upstream/main": ingestTargetSha,
        }[refOrSha] ?? null
      );
    },

    async listCommits() {
      return [
        {
          sha: "2222222",
          title: "Adjust prompt role hidden compaction goal tool sandbox behavior",
          message:
            "Updates prompt text, message role boundaries, hidden context, goals, tools, and permissions.",
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
                "@@ -1,2 +1,2 @@ prompt one",
                "-old prompt",
                "+new prompt",
                "@@ -10,0 +10,2 @@ prompt two",
                "+new prompt line",
                "+new instruction line",
              ].join("\n"),
            },
            {
              path: "codex-rs/core/src/sandbox.rs",
              oldPath: null,
              changeKind: "modified",
              patch: [
                "diff --git a/codex-rs/core/src/sandbox.rs b/codex-rs/core/src/sandbox.rs",
                "--- a/codex-rs/core/src/sandbox.rs",
                "+++ b/codex-rs/core/src/sandbox.rs",
                "@@ -4 +4 @@ sandbox",
                "-old sandbox",
                "+new sandbox",
              ].join("\n"),
            },
          ],
        },
        {
          sha: "3333333",
          title: "Update README",
          message: null,
          authorName: "OpenAI",
          committedAt: reviewTestNow,
          files: [
            {
              path: "docs/readme.md",
              oldPath: null,
              changeKind: "modified",
              patch: [
                "diff --git a/docs/readme.md b/docs/readme.md",
                "--- a/docs/readme.md",
                "+++ b/docs/readme.md",
                "@@ -1 +1 @@",
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
