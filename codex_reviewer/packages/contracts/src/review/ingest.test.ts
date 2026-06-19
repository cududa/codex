import { reviewTestRange, reviewVersionReadFixture } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import { IngestReviewVersionRequestSchema, IngestReviewVersionResponseSchema } from "./api.js";

describe("review ingest contracts", () => {
  it("validates deterministic ingest command contracts", () => {
    const request = IngestReviewVersionRequestSchema.parse({
      repositoryId: reviewTestRange.repositoryId,
      baseRefOrSha: reviewTestRange.baseRef,
      targetRefOrSha: reviewTestRange.targetRef,
      label: reviewTestRange.label,
      source: "system-ingest",
      concernMapVersion: "deterministic-concern-map-v1",
    });

    expect(request).toEqual({
      repositoryId: reviewTestRange.repositoryId,
      baseRefOrSha: reviewTestRange.baseRef,
      targetRefOrSha: reviewTestRange.targetRef,
      label: reviewTestRange.label,
      source: "system-ingest",
      concernMapVersion: "deterministic-concern-map-v1",
    });
    expect(() =>
      IngestReviewVersionRequestSchema.parse({
        repositoryId: reviewTestRange.repositoryId,
        baseRefOrSha: reviewTestRange.baseRef,
        targetRefOrSha: reviewTestRange.targetRef,
        source: "system-ingest",
      }),
    ).toThrow();
  });

  it("validates deterministic ingest responses without review-state write wrappers", () => {
    expect(
      IngestReviewVersionResponseSchema.parse({
        created: true,
        version: { ...reviewVersionReadFixture(), commitCount: 0, commits: [] },
      }),
    ).toMatchObject({
      created: true,
      version: { id: "version-1" },
    });
  });
});
