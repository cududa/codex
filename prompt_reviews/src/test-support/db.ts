import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { migratePromptReviewsDatabase } from "../db/migrate.js";
import { openPromptReviewsDatabase, type OpenPromptReviewsDatabase } from "../db/client.js";

export type TempPromptReviewsDatabase = OpenPromptReviewsDatabase & {
  path: string;
  cleanup: () => void;
};

export function createTempPromptReviewsDatabase(options: { migrate?: boolean } = {}): TempPromptReviewsDatabase {
  const directory = mkdtempSync(path.join(tmpdir(), "prompt-reviews-db-"));
  const databasePath = path.join(directory, "test.sqlite");
  const opened = openPromptReviewsDatabase(databasePath);

  if (options.migrate === true) {
    migratePromptReviewsDatabase(opened);
  }

  return {
    ...opened,
    path: databasePath,
    cleanup: () => {
      opened.close();
      rmSync(directory, { force: true, recursive: true });
    },
  };
}
