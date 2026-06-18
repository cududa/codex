import { AgentReviewSchema, HumanApprovalSchema, ReviewEventSchema } from "./review-actions.js";
import {
  ConcernAreasResponseSchema,
  ReviewBootstrapResponseSchema,
  ReviewMarksResponseSchema,
  ReviewSchemaCatalogResponseSchema,
} from "./api.js";
import { ConcernAreaSchema, ConcernAreaSelectionSchema, ConcernAreaSlugSchema } from "./concern-areas.js";
import { DecisionNoteSchema } from "./decision-notes.js";
import { DetectorEvidenceSchema, DetectorRunSchema } from "./detector-evidence.js";
import { DiffBlockSchema, ReviewCommitSchema, ReviewFileSchema, ReviewVersionSchema } from "./reviewables.js";
import { LocalChangeRefSchema } from "./local-change-refs.js";
import { ReviewLedgerEntrySchema, ReviewLedgerSchema, VersionFinalizationSchema } from "./ledger.js";
import { ReviewMarkSchema } from "./review-marks.js";
import { ReviewPlanSchema } from "./review-plans.js";
import { ReviewScopeSchema } from "./scopes.js";
import { ThreadedCommentSchema } from "./threaded-comments.js";

export const reviewSchemas = {
  AgentReview: AgentReviewSchema,
  ConcernAreasResponse: ConcernAreasResponseSchema,
  ConcernArea: ConcernAreaSchema,
  ConcernAreaSelection: ConcernAreaSelectionSchema,
  ConcernAreaSlug: ConcernAreaSlugSchema,
  DecisionNote: DecisionNoteSchema,
  DetectorEvidence: DetectorEvidenceSchema,
  DetectorRun: DetectorRunSchema,
  DiffBlock: DiffBlockSchema,
  HumanApproval: HumanApprovalSchema,
  LocalChangeRef: LocalChangeRefSchema,
  ReviewCommit: ReviewCommitSchema,
  ReviewEvent: ReviewEventSchema,
  ReviewFile: ReviewFileSchema,
  ReviewLedger: ReviewLedgerSchema,
  ReviewLedgerEntry: ReviewLedgerEntrySchema,
  ReviewMark: ReviewMarkSchema,
  ReviewBootstrapResponse: ReviewBootstrapResponseSchema,
  ReviewMarksResponse: ReviewMarksResponseSchema,
  ReviewPlan: ReviewPlanSchema,
  ReviewSchemaCatalogResponse: ReviewSchemaCatalogResponseSchema,
  ReviewScope: ReviewScopeSchema,
  ReviewVersion: ReviewVersionSchema,
  ThreadedComment: ThreadedCommentSchema,
  VersionFinalization: VersionFinalizationSchema,
} as const;

export type ReviewSchemaName = keyof typeof reviewSchemas;
