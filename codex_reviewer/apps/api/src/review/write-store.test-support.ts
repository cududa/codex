import { ActorRefSchema } from "@prompt-reviews/contracts";
import { reviewTestActors } from "@prompt-reviews/review-test-support";
import type { ReviewDatabaseConnection } from "../db/client.js";
import { createReviewReadStore } from "./read-store.js";
import { createReviewWriteStore } from "./write-store.js";

export const reviewWriteActor = ActorRefSchema.parse(reviewTestActors.human);

export function createReviewWriteTestStore(connection: ReviewDatabaseConnection) {
  const readStore = createReviewReadStore(connection.db);
  return createReviewWriteStore(connection.db, readStore);
}
