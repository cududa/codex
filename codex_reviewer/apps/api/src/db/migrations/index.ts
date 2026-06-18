import { coreStatements } from "./0001-core.js";
import type { DatabaseMigration } from "./types.js";

export const databaseMigrations: DatabaseMigration[] = [
  {
    id: "0001_review_core",
    statements: coreStatements,
  },
];

export type { DatabaseMigration } from "./types.js";
