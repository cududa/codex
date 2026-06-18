import { z } from "zod";
import { ConcernAreaSlugSchema } from "./concern-areas.js";
import { ReviewMarkSchema } from "./review-marks.js";
import { DiffSideSchema, ReviewScopeSchema } from "./scopes.js";
import {
  IdSchema,
  IsoDateTimeSchema,
  MarkdownStringSchema,
  NonEmptyStringSchema,
  PositiveLineNumberSchema,
} from "../shared/primitives.js";

export const DetectorRunStateSchema = z
  .enum(["running", "completed", "failed"])
  .describe("Lifecycle state for a detector run over a review version.");

export const DetectorRunSchema = z
  .object({
    id: IdSchema.describe("Identifier for this detector run."),
    versionId: IdSchema.describe("Review version analyzed by the detector."),
    concernMapVersion: z.number().int().positive().describe("Concern map definition version used by this detector run."),
    state: DetectorRunStateSchema.describe("Current lifecycle state of the detector run."),
    startedAt: IsoDateTimeSchema.describe("When the detector run started."),
    completedAt: IsoDateTimeSchema.optional().describe("When the detector run completed successfully."),
    failureMessage: MarkdownStringSchema.optional().describe("Failure details when the detector run failed."),
  })
  .strict()
  .superRefine((run, context) => {
    if (run.state === "completed" && run.completedAt === undefined) {
      context.addIssue({
        code: "custom",
        message: "completed detector runs require completedAt",
        path: ["completedAt"],
      });
    }

    if (run.state === "failed" && run.failureMessage === undefined) {
      context.addIssue({
        code: "custom",
        message: "failed detector runs require failureMessage",
        path: ["failureMessage"],
      });
    }

    if (run.state === "running" && (run.completedAt !== undefined || run.failureMessage !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "running detector runs cannot include completion or failure fields",
        path: ["state"],
      });
    }
  })
  .describe("A detector pass that produced canonical evidence for a review version.");

export const DetectorEvidenceDetailSchema = z
  .discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("path").describe("Evidence came from a path owned by a concern area."),
        path: NonEmptyStringSchema.describe("Repository path that matched the detector concern map."),
      })
      .strict(),
    z
      .object({
        kind: z.literal("symbol").describe("Evidence came from a source symbol owned by a concern area."),
        path: NonEmptyStringSchema.optional().describe("Repository path where the symbol was found."),
        symbolName: NonEmptyStringSchema.describe("Source symbol that matched the detector concern map."),
      })
      .strict(),
    z
      .object({
        kind: z.literal("marker").describe("Evidence came from a string marker owned by a concern area."),
        path: NonEmptyStringSchema.optional().describe("Repository path where the marker was found."),
        marker: NonEmptyStringSchema.describe("String marker that matched the detector concern map."),
      })
      .strict(),
    z
      .object({
        kind: z.literal("templateMarker").describe("Evidence came from a template marker owned by a concern area."),
        path: NonEmptyStringSchema.optional().describe("Repository path where the template marker was found."),
        marker: NonEmptyStringSchema.describe("Template marker that matched the detector concern map."),
      })
      .strict(),
    z
      .object({
        kind: z.literal("diff").describe("Evidence came from a changed diff block."),
        diffBlockId: IdSchema.describe("Diff block that contains the evidence."),
        side: DiffSideSchema.optional().describe("Diff side where the evidence appears, when line-specific."),
        startLine: PositiveLineNumberSchema.optional().describe("First line of line-specific evidence."),
        endLine: PositiveLineNumberSchema.optional().describe("Last line of line-specific evidence."),
      })
      .strict()
      .refine((detail) => detail.startLine === undefined || detail.endLine === undefined || detail.startLine <= detail.endLine, {
        message: "startLine must be less than or equal to endLine",
        path: ["endLine"],
      }),
    z
      .object({
        kind: z.literal("graph").describe("Evidence came from detector graph expansion."),
        nodeId: NonEmptyStringSchema.describe("Stable detector graph node identifier."),
        label: NonEmptyStringSchema.optional().describe("Human-readable graph node label."),
      })
      .strict(),
  ])
  .describe("Typed provenance for one detector evidence record.");

export const DetectorEvidenceSchema = z
  .object({
    id: IdSchema.describe("Identifier for this detector evidence record."),
    runId: IdSchema.describe("Detector run that produced this evidence."),
    scope: ReviewScopeSchema.describe("Review scope affected by this evidence."),
    concernArea: ConcernAreaSlugSchema.describe("Concern area indicated by this evidence."),
    suggestedReviewMark: ReviewMarkSchema.optional().describe("Review mark suggested by this detector evidence."),
    title: NonEmptyStringSchema.describe("Short evidence title."),
    summary: MarkdownStringSchema.optional().describe("Optional explanation of why this evidence matters."),
    detail: DetectorEvidenceDetailSchema.describe("Typed detector evidence detail."),
    createdAt: IsoDateTimeSchema.describe("When this evidence was recorded."),
  })
  .strict()
  .describe("Canonical detector evidence distinct from editable review state.");

export type DetectorRunState = z.infer<typeof DetectorRunStateSchema>;
export type DetectorRun = z.infer<typeof DetectorRunSchema>;
export type DetectorEvidenceDetail = z.infer<typeof DetectorEvidenceDetailSchema>;
export type DetectorEvidence = z.infer<typeof DetectorEvidenceSchema>;
