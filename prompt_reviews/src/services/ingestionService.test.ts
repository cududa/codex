import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GitClient } from "../git/gitClient.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import { createIngestionService } from "./ingestionService.js";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("createIngestionService", () => {
  it("exposes populateNextVersion through the service boundary", async () => {
    const gitClient: GitClient = {
      async resolveRef(refOrSha) {
        return refOrSha === "base" ? "1".repeat(40) : "2".repeat(40);
      },
      async listCommits() {
        return [];
      },
      async listChangedFiles() {
        return [];
      },
      async getCommitDiff() {
        return "";
      },
      async getFileAtCommit() {
        return null;
      },
    };
    const service = createIngestionService({ db: database.db, gitClient });

    await expect(
      service.populateNextVersion({
        repositoryId: "codex",
        baseRefOrSha: "base",
        targetRef: "target",
        label: "service-populate",
      }),
    ).resolves.toMatchObject({
      baseSha: "1".repeat(40),
      targetSha: "2".repeat(40),
      created: true,
    });
  });
});
