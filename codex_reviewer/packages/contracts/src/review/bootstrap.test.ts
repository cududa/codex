import { describe, expect, it } from "vitest";
import { ReviewBootstrapResponseSchema } from "./api.js";
import { concernAreas } from "./concern-areas.js";
import { reviewMarkDefinitions } from "./review-marks.js";

describe("review bootstrap contracts", () => {
  it("keeps bootstrap data focused on canonical workflow vocabulary", () => {
    expect(
      ReviewBootstrapResponseSchema.parse({
        concernAreas,
        reviewMarks: reviewMarkDefinitions,
      }),
    ).toEqual({
      concernAreas,
      reviewMarks: reviewMarkDefinitions,
    });
  });
});
