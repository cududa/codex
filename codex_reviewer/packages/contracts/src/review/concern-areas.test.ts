import { reviewTestConcernAreas } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import {
  ConcernAreaSelectionSchema,
  concernAreaSlugs,
  concernAreas,
  maxSelectedConcernAreas,
  requireConcernArea,
} from "./concern-areas.js";

describe("concern area contracts", () => {
  it("defines exactly the canonical concern areas", () => {
    expect(concernAreaSlugs).toEqual([
      "harness-prompts",
      "message-roles",
      "hidden-context",
      "goal-continuation",
      "goal-behavior",
      "context-compaction",
      "tool-affordances",
      "permission-defaults",
    ]);
    expect(concernAreas.map((area) => area.slug)).toEqual(concernAreaSlugs);
    expect(requireConcernArea(reviewTestConcernAreas.primary)).toEqual({
      slug: reviewTestConcernAreas.primary,
      label: "Tool Affordances",
      description:
        "Changes to tool availability, descriptions, schemas, routing, execution, or model-facing affordances.",
      sortOrder: 6,
    });
  });

  it("keeps concern area selections ordered and unique", () => {
    expect(
      ConcernAreaSelectionSchema.parse([
        "message-roles",
        reviewTestConcernAreas.primary,
        reviewTestConcernAreas.secondary,
      ]),
    ).toEqual(["message-roles", reviewTestConcernAreas.primary, reviewTestConcernAreas.secondary]);
    expect(() =>
      ConcernAreaSelectionSchema.parse([reviewTestConcernAreas.primary, reviewTestConcernAreas.primary]),
    ).toThrow();
    expect(maxSelectedConcernAreas).toBe(3);
    expect(() =>
      ConcernAreaSelectionSchema.parse([
        "message-roles",
        reviewTestConcernAreas.primary,
        reviewTestConcernAreas.secondary,
        reviewTestConcernAreas.alternate,
      ]),
    ).toThrow();
  });
});
