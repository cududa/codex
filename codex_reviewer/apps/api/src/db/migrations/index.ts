import { coreStatements } from "./0001-core.js";
import { reviewEventStatements } from "./0002-review-events.js";
import type { DatabaseMigration } from "./types.js";

export const databaseMigrations: DatabaseMigration[] = [
  {
    id: "0001_review_core",
    statements: coreStatements,
  },
  {
    id: "0002_review_events",
    statements: reviewEventStatements,
  },
];

export type { DatabaseMigration } from "./types.js";
