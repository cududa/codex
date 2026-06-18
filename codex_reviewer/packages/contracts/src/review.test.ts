import { describe, expect, it } from "vitest";
import {
  ConcernAreaSelectionSchema,
  ReviewBootstrapResponseSchema,
  ReviewCommitReadSchema,
  ReviewFileReadSchema,
  ReviewMarkSchema,
  SetCommitConcernAreasRequestSchema,
  SetCommitReviewMarkRequestSchema,
  SetFileReviewMarkRequestSchema,
  ReviewVersionsResponseSchema,
  concernAreaSlugs,
  concernAreas,
  maxSelectedConcernAreas,
  requireConcernArea,
  reviewMarkDefinitions,
  reviewMarks,
} from "./index.js";

const now = "2026-06-17T12:00:00.000Z";

describe("review contracts", () => {
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
    expect(requireConcernArea("tool-affordances")).toEqual({
      slug: "tool-affordances",
      label: "Tool Affordances",
      description:
        "Changes to tool availability, descriptions, schemas, routing, execution, or model-facing affordances.",
      sortOrder: 6,
    });
  });

  it("keeps concern area selections ordered and unique", () => {
    expect(
      ConcernAreaSelectionSchema.parse(["message-roles", "tool-affordances", "permission-defaults"]),
    ).toEqual(["message-roles", "tool-affordances", "permission-defaults"]);
    expect(() => ConcernAreaSelectionSchema.parse(["message-roles", "message-roles"])).toThrow();
    expect(maxSelectedConcernAreas).toBe(3);
    expect(() =>
      ConcernAreaSelectionSchema.parse([
        "message-roles",
        "tool-affordances",
        "permission-defaults",
        "hidden-context",
      ]),
    ).toThrow();
  });

  it("defines review marks as PASS, FLAG, and MODIFY only", () => {
    expect(reviewMarks).toEqual(["PASS", "FLAG", "MODIFY"]);
    expect(reviewMarkDefinitions).toEqual([
      {
        mark: "PASS",
        label: "Pass",
        description: "Reviewed and no local adaptation is required.",
        requiresLocalChangeEvidence: false,
      },
      {
        mark: "FLAG",
        label: "Flag",
        description: "Investigation is required before the review can resolve to pass or modify.",
        requiresLocalChangeEvidence: false,
      },
      {
        mark: "MODIFY",
        label: "Modify",
        description: "The upstream change requires intentional local adaptation before approval.",
        requiresLocalChangeEvidence: true,
      },
    ]);
    expect(() => ReviewMarkSchema.parse("INVALID_REVIEW_MARK")).toThrow();
  });

  it("requires actors for review-state write requests", () => {
    const actor = { type: "human", id: "human-1", displayName: "Cullen" };

    expect(
      SetCommitReviewMarkRequestSchema.parse({
        actor,
        reviewMark: "PASS",
      }),
    ).toEqual({
      actor,
      reviewMark: "PASS",
    });
    expect(
      SetFileReviewMarkRequestSchema.parse({
        actor,
        reviewMark: null,
      }),
    ).toEqual({
      actor,
      reviewMark: null,
    });
    expect(
      SetCommitConcernAreasRequestSchema.parse({
        actor,
        concernAreas: ["tool-affordances", "hidden-context"],
      }),
    ).toEqual({
      actor,
      concernAreas: ["tool-affordances", "hidden-context"],
    });
    expect(() => SetCommitReviewMarkRequestSchema.parse({ reviewMark: "INVALID_REVIEW_MARK" })).toThrow();
    expect(() =>
      SetFileReviewMarkRequestSchema.parse({ actor, reviewMark: "INVALID_REVIEW_MARK" }),
    ).toThrow();
    expect(() =>
      SetCommitConcernAreasRequestSchema.parse({
        actor,
        concernAreas: ["hidden-context", "hidden-context"],
      }),
    ).toThrow();
  });

  it("models commit concern areas only at commit level", () => {
    expect(
      ReviewCommitReadSchema.parse({
        id: "commit-1",
        versionId: "version-1",
        sha: "1234567",
        position: 0,
        title: "Adjust tool prompt",
        message: null,
        authorName: null,
        committedAt: null,
        reviewMark: "MODIFY",
        concernAreas: ["tool-affordances"],
        createdAt: now,
        updatedAt: null,
        files: [],
      }),
    ).toMatchObject({
      concernAreas: ["tool-affordances"],
      reviewMark: "MODIFY",
    });

    expect(() =>
      ReviewFileReadSchema.parse({
        id: "file-1",
        commitId: "commit-1",
        position: 0,
        path: "codex-rs/core/src/prompt.rs",
        oldPath: null,
        changeKind: "modified",
        reviewMark: "FLAG",
        concernAreas: ["tool-affordances"],
        createdAt: now,
        updatedAt: null,
        diffBlocks: [],
      }),
    ).toThrow();
  });

  it("validates the first-slice workbench read response", () => {
    expect(
      ReviewVersionsResponseSchema.parse({
        versions: [
          {
            id: "version-1",
            label: "Upstream review",
            repositoryId: "openai/codex",
            baseRef: "local-main",
            targetRef: "upstream/main",
            baseSha: null,
            targetSha: "abcdef1",
            createdAt: now,
            updatedAt: null,
            commitCount: 1,
            commits: [
              {
                id: "commit-1",
                versionId: "version-1",
                sha: "abcdef1",
                position: 0,
                title: "Adjust tool prompt",
                message: null,
                authorName: "OpenAI",
                committedAt: now,
                reviewMark: "FLAG",
                concernAreas: ["tool-affordances"],
                createdAt: now,
                updatedAt: null,
                files: [
                  {
                    id: "file-1",
                    commitId: "commit-1",
                    position: 0,
                    path: "codex-rs/core/src/prompt.rs",
                    oldPath: null,
                    changeKind: "modified",
                    reviewMark: null,
                    createdAt: now,
                    updatedAt: null,
                    diffBlocks: [
                      {
                        id: "diff-1",
                        fileId: "file-1",
                        position: 0,
                        heading: "prompt",
                        oldStartLine: 1,
                        oldEndLine: 1,
                        newStartLine: 1,
                        newEndLine: 1,
                        patch: "@@ -1 +1 @@\n-old\n+new",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      versions: [{ commitCount: 1 }],
    });
  });

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
