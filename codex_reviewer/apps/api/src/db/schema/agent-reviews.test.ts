import {
  reviewTestActors,
  reviewTestConcernAreas,
  reviewTestIds,
  reviewTestNow,
} from "@prompt-reviews/review-test-support";
import { asc } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../../test-support/review-spine.js";
import { agentReviewConcernAreas, agentReviews } from "./index.js";

afterEach(cleanupTestDatabases);

describe("agent review persistence schema", () => {
  it("stores agent review evidence rows with ordered commit concern areas", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await connection.db.insert(agentReviews).values({
      id: reviewTestIds.agentReview,
      commitId: reviewTestIds.commit,
      fileId: null,
      reviewedMark: "MODIFY",
      reviewerActorType: "agent",
      reviewerActorId: reviewTestActors.agent.id,
      reviewerActorDisplayName: reviewTestActors.agent.displayName,
      notesMarkdown: "The current commit mark is correct.",
      createdAt: reviewTestNow,
    });
    await connection.db.insert(agentReviewConcernAreas).values([
      {
        agentReviewId: reviewTestIds.agentReview,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 0,
      },
      {
        agentReviewId: reviewTestIds.agentReview,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.primary,
        position: 1,
      },
    ]);

    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([
      {
        id: reviewTestIds.agentReview,
        commitId: reviewTestIds.commit,
        fileId: null,
        reviewedMark: "MODIFY",
        reviewerActorType: "agent",
        reviewerActorId: reviewTestActors.agent.id,
        reviewerActorDisplayName: reviewTestActors.agent.displayName,
        notesMarkdown: "The current commit mark is correct.",
        createdAt: reviewTestNow,
      },
    ]);
    await expect(
      connection.db.select().from(agentReviewConcernAreas).orderBy(asc(agentReviewConcernAreas.position)),
    ).resolves.toEqual([
      {
        agentReviewId: reviewTestIds.agentReview,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 0,
      },
      {
        agentReviewId: reviewTestIds.agentReview,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.primary,
        position: 1,
      },
    ]);
  });

  it("rejects targetless agent reviews and reviews with two targets", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await expect(
      connection.db.insert(agentReviews).values({
        id: "agent-review-targetless",
        commitId: null,
        fileId: null,
        reviewedMark: "PASS",
        reviewerActorType: "agent",
        reviewerActorId: reviewTestActors.agent.id,
        createdAt: reviewTestNow,
      }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(agentReviews).values({
        id: "agent-review-two-targets",
        commitId: reviewTestIds.commit,
        fileId: reviewTestIds.file,
        reviewedMark: "PASS",
        reviewerActorType: "agent",
        reviewerActorId: reviewTestActors.agent.id,
        createdAt: reviewTestNow,
      }),
    ).rejects.toThrow();
  });

  it("rejects non-agent reviewer actor types", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO agent_reviews
            (id, commit_id, reviewed_mark, reviewer_actor_type, reviewer_actor_id, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?)
        `,
        args: [
          "agent-review-human",
          reviewTestIds.commit,
          "PASS",
          "human",
          reviewTestActors.human.id,
          reviewTestNow,
        ],
      }),
    ).rejects.toThrow();
  });

  it("rejects reviewed marks outside PASS, FLAG, and MODIFY", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO agent_reviews
            (id, commit_id, reviewed_mark, reviewer_actor_type, reviewer_actor_id, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?)
        `,
        args: ["agent-review-invalid-mark", reviewTestIds.commit, "DONE", "agent", "agent-1", reviewTestNow],
      }),
    ).rejects.toThrow();
  });

  it("rejects concern areas for file-scoped agent reviews", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await connection.db.insert(agentReviews).values({
      id: "agent-review-file",
      commitId: null,
      fileId: reviewTestIds.file,
      reviewedMark: "PASS",
      reviewerActorType: "agent",
      reviewerActorId: reviewTestActors.agent.id,
      createdAt: reviewTestNow,
    });
    await expect(
      connection.db.insert(agentReviewConcernAreas).values({
        agentReviewId: "agent-review-file",
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 0,
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid concern area slugs, positions, and missing commit ownership", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await connection.db.insert(agentReviews).values({
      id: reviewTestIds.agentReview,
      commitId: reviewTestIds.commit,
      fileId: null,
      reviewedMark: "PASS",
      reviewerActorType: "agent",
      reviewerActorId: reviewTestActors.agent.id,
      createdAt: reviewTestNow,
    });
    await expect(
      connection.db.insert(agentReviewConcernAreas).values({
        agentReviewId: reviewTestIds.agentReview,
        commitId: "missing",
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 0,
      }),
    ).rejects.toThrow();
    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO agent_review_concern_areas
            (agent_review_id, commit_id, concern_area_slug, position)
          VALUES
            (?, ?, ?, ?)
        `,
        args: [reviewTestIds.agentReview, reviewTestIds.commit, "not-canonical", 0],
      }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(agentReviewConcernAreas).values({
        agentReviewId: reviewTestIds.agentReview,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 3,
      }),
    ).rejects.toThrow();
  });
});
