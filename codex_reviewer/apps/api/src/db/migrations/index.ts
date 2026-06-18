import { collaborationStatements } from "./0001-collaboration.js";
import { coreStatements } from "./0001-core.js";
import { detectorStatements } from "./0001-detector.js";
import { ledgerStatements } from "./0001-ledger.js";
import { reviewStateStatements } from "./0001-review-state.js";
import type { DatabaseMigration } from "./types.js";

export const databaseMigrations: DatabaseMigration[] = [
  {
    id: "0001_fresh_review_schema",
    statements: [
      ...coreStatements,
      ...detectorStatements,
      ...reviewStateStatements,
      ...collaborationStatements,
      ...ledgerStatements,
    ],
  },
];

export type { DatabaseMigration } from "./types.js";
