import { reviewTestActors, reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { agentReviewConcernAreas, agentReviews, reviewEvents } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import { agentReviewActor, createAgentReviewTestStore } from "./agent-review-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("agent review evidence validation", () => {
  it("rejects missing targets and non-agent actors without writing evidence", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createAgentReviewTestStore(connection);

    await expect(
      store.recordCommitAgentReview({
        commitId: "missing",
        actor: agentReviewActor,
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      store.recordFileAgentReview({
        fileId: "missing",
        actor: agentReviewActor,
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      store.recordCommitAgentReview({
        commitId: reviewTestIds.commit,
        actor: { type: "human", id: reviewTestActors.human.id },
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      } as unknown as Parameters<typeof store.recordCommitAgentReview>[0]),
    ).rejects.toThrow();

    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });

  it("rejects invalid concern selections and empty notes before persistence", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createAgentReviewTestStore(connection);

    await expect(
      store.recordCommitAgentReview({
        commitId: reviewTestIds.commit,
        actor: agentReviewActor,
        reviewedMark: "PASS",
        reviewedConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.alternate],
        notesMarkdown: null,
      }),
    ).rejects.toThrow();
    await expect(
      store.recordCommitAgentReview({
        commitId: reviewTestIds.commit,
        actor: agentReviewActor,
        reviewedMark: "PASS",
        reviewedConcernAreas: [reviewTestConcernAreas.alternate],
        notesMarkdown: "",
      }),
    ).rejects.toThrow();

    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toEqual([]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });
});
