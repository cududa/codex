import { coreStatements } from "./0001-core.js";
import { reviewEventStatements } from "./0002-review-events.js";
import { agentReviewStatements } from "./0003-agent-reviews.js";
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
  {
    id: "0003_agent_reviews",
    statements: agentReviewStatements,
  },
];

export type { DatabaseMigration } from "./types.js";
