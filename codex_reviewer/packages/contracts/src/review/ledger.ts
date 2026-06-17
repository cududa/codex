import { z } from "zod";
import { HumanActorRefSchema } from "./actors.js";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { LocalChangeRefSchema } from "./local-change-refs.js";
import { FinalReviewMarkSchema } from "./review-marks.js";
import { GitShaSchema, IdSchema, IsoDateTimeSchema, MarkdownStringSchema } from "../shared/primitives.js";

export const ReviewLedgerEntrySchema = z
  .object({
    commitId: IdSchema.describe("Reviewed commit represented by this ledger entry."),
    upstreamSha: GitShaSchema.describe("Upstream commit SHA accepted by this review entry."),
    finalMark: FinalReviewMarkSchema.describe("Final review mark after all required work is complete."),
    concernAreas: ConcernAreaSelectionSchema.describe("Final ordered concern areas for the upstream commit."),
    localChangeRefs: z.array(LocalChangeRefSchema).describe("Local commits linked as completed adaptation evidence."),
    approvedBy: HumanActorRefSchema.describe("Human reviewer who approved the final commit state."),
    approvedAt: IsoDateTimeSchema.describe("When the final commit state was approved."),
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.finalMark === "DONE" && entry.localChangeRefs.length === 0) {
      context.addIssue({
        code: "custom",
        message: "DONE ledger entries require at least one local change reference",
        path: ["localChangeRefs"],
      });
    }
  })
  .describe("Final ledger entry for one reviewed upstream commit.");

export const ReviewLedgerSchema = z
  .object({
    versionId: IdSchema.describe("Review version summarized by the ledger."),
    generatedAt: IsoDateTimeSchema.describe("When the ledger was generated."),
    generatedBy: HumanActorRefSchema.describe("Human reviewer that finalized the ledger."),
    summary: MarkdownStringSchema.optional().describe("Optional final review summary."),
    entries: z.array(ReviewLedgerEntrySchema).describe("Final commit-level review ledger entries."),
  })
  .strict()
  .describe("Final review ledger for an accepted upstream range.");

export const VersionFinalizationSchema = z
  .object({
    id: IdSchema.describe("Identifier for this version finalization record."),
    versionId: IdSchema.describe("Review version that was finalized."),
    finalizedBy: HumanActorRefSchema.describe("Human reviewer that finalized the version."),
    finalizedAt: IsoDateTimeSchema.describe("When the version was finalized."),
    ledger: ReviewLedgerSchema.describe("Ledger produced by finalization."),
  })
  .strict()
  .describe("Human finalization record for a completed review version.");

export type ReviewLedgerEntry = z.infer<typeof ReviewLedgerEntrySchema>;
export type ReviewLedger = z.infer<typeof ReviewLedgerSchema>;
export type VersionFinalization = z.infer<typeof VersionFinalizationSchema>;
