import { AgentActorRefSchema } from "@prompt-reviews/contracts";
import { reviewTestActors, reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import type { ReviewDatabaseConnection } from "../db/client.js";
import { createAgentReviewStore } from "./agent-review-store.js";
import { createReviewReadStore } from "./read-store.js";

export const agentReviewActor = AgentActorRefSchema.parse(reviewTestActors.agent);

export function createAgentReviewTestStore(connection: ReviewDatabaseConnection) {
  const readStore = createReviewReadStore(connection.db);
  return createAgentReviewStore(connection.db, readStore);
}

export function recordCommitAgentReviewInput() {
  return {
    commitId: reviewTestIds.commit,
    actor: agentReviewActor,
    reviewedMark: "MODIFY" as const,
    reviewedConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.primary],
    notesMarkdown: "The current commit mark should remain challenged.",
  };
}

export function recordFileAgentReviewInput() {
  return {
    fileId: reviewTestIds.file,
    actor: agentReviewActor,
    reviewedMark: "PASS" as const,
    notesMarkdown: null,
  };
}
